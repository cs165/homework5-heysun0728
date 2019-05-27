const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

// TODO(you): Change the value of this string to the spreadsheet id for your
// GSA spreadsheet. See HW5 spec for more information.
const SPREADSHEET_ID = '1b6GGNiocsIB7PoZIu1kZFg6W7Lxw6eeqpKXNrzePxRM';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

function getColumnIndex(rows,columnValue){
  var index;
  for(index=0;index<rows[0].length;index++){
    if(rows[0][index].toLowerCase()===columnValue.toLowerCase()) break;
  }
  return index;
}
function getRowIndexByValue(rows,column,value){
  var r;
  for(r=1;r<rows.length;r++){
    if(rows[r][column]==value) break;
  }
  return r;
}

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
  console.log(rows);
  var json_result=[]
  for(var i=1;i<rows.length;i++){
    var r={};
    for(var j=0;j<rows[0].length;j++){
      r[rows[0][j]]=rows[i][j];
    }
    json_result[i-1]=r;
  }
  // TODO(you): Finish onGet.
  res.json(json_result);
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;

  // TODO(you): Implement onPost.
  const getres = await sheet.getRows();
  const rows = getres.rows;

  var newRow=[];
  for(var key in messageBody){
    newRow[getColumnIndex(rows,key)]=messageBody[key];
  }
  console.log(newRow);
  const appres = await sheet.appendRow(newRow)
  res.json(appres);
}
app.post('/api', jsonParser, onPost);

async function onPatch(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const messageBody = req.body;

  // TODO(you): Implement onPatch.
  const getres = await sheet.getRows();
  const rows = getres.rows;
  var c=getColumnIndex(rows,column);
  //the row to be updated
  var r=getRowIndexByValue(rows,c,value);
  //copy all data of this row to newRow
  if(r<rows.length){
    var newRow=rows[r];
    for(var key in messageBody){
      newRow[getColumnIndex(rows,key)]=messageBody[key];
    }
    console.log(newRow);
    const setres = await sheet.setRow(r,newRow);
    res.json(setres);
  }else{
    console.log("can't find this row");
    res.json({"response": "success"});
  }
}
app.patch('/api/:column/:value', jsonParser, onPatch);

async function onDelete(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;

  // TODO(you): Implement onDelete.
  const getres = await sheet.getRows();
  const rows = getres.rows;
 
  //find column index
  var c=getColumnIndex(rows,column);
  //find match row
  var r=getRowIndexByValue(rows,c,value);
  //if there are no rows
  if(r<rows.length){
    console.log("delete row"+r);
    const delres = await sheet.deleteRow(r);
    res.json( delres );
  }else{
    console.log("can't find this row");
    res.json({"response": "success"});
  }
}
app.delete('/api/:column/:value',  onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server listening on port ${port}!`);
});
