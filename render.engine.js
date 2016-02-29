/**

*/
function render(src,data)
{
  // source code
  this.src  = src;

  // data as object[s] : normal data
  this.data = data;

  this.syntax = {
    loop:{
      attrs:['times','cond']
    },
    if:{
      attrs:['cond']
    }
  }

  this.HelperVars = {
    loop:['count']
  }
  /**
  @return array of command and the content betweend command
  */
  this.getCommand = function(command,withAttr,src){
    //patt = '\{\{\@' + command + '\}\}([\\s\\S]*?)\{\{\@end\}\}';
    var source = src || this.src;
    var patt = '\{\{\@' + command + '\s*(.*?)\}\}([\\s\\S]*?)\{\{\@end\}\}';
    var r = new RegExp(patt,'gi');

    this[command] = source.match(r);
    this[command]['text'] = this[command].map(function(v){
      return v.replace(new RegExp('\{\{\@' + command + '\s*(.*)\}\}','gi'),'').replace(/\{\{\@end\}\}/gi,'').trim();
    });

    if(withAttr){
      var attrPatt = new RegExp('\{\{\@' + command + '\s*(.+)\}\}','gi');
      if(attrPatt.test(source)){
        var self = this;
        this[command]['attrs'] = source.match(attrPatt).map(function(v){

          arr = v.replace('{{@'+command,'').replace('}}','').trim().split(';');

          if(command == 'if')
            return arr;

          var attrs = {};

          for (var i = 0; i < arr.length; i++) {
            var x = arr[i].split(':');

            // is Valid attr?
            if(self.syntax[command]['attrs'].indexOf(x[0]) > -1){
              if(/#(.*)/.test(x[1])){
                m = x[1].match(/#(.*)/);
                attrs[x[0]] = self.getVarsVal(m[1]);
              }else{

                attrs[x[0]] = x[1];
              }

            // invalid attr
            }else{
              throw new SyntaxError("[RENDER_ENGINE] : ERROR SYNTAX IN LOOP",'render.engine.js',39);
            }
          }
          return attrs;
        });

      }

    }
  }

  /**
  Processering Data : open and set all data in one object.
  */
  this.prD = function(){
    var prDfinal = {};
    // One Level
    data = this.data;
    for(k in data){
      if(typeof data[k] == 'object'){
        var parentKey = k;
        // go To Child pass: parentkey and data
        prDfinal = Object.assign(prDfinal,this.prDChild(parentKey,data[k]));

      }else{
        prDfinal[k] = data[k];
      }
    }

    return prDfinal;
  }

  /**
  Helper function @see this.prD()
  */
  this.prDChild = function(parent,data){
    // to save data
    var final = {};

    // start for!
    for (key in data){
      // is object ? ok rerun this function!
      if(typeof data[key] == 'object'){
        // rerun this function again !
        r = this.prDChild(key,data[key]);

        // append to final child data object!
        for(k in r){
          final[parent+'.'+k] = r[k];
        }
      }else{
        // not object? ok append by parent key and his key.
        final[parent+'.'+key] = data[key];
      }
    }
    return final;
  }

  /**
  get All vars in source : {{varname}}
  @param string src the source
  */
  this.getVars = function(src){
    var r = new RegExp('\{\{[^\@\\s]+\}\}','ig');
    if(r.test(src)){
      return src.match(r).map(function(v){
        return v.replace('{{','').replace('}}','');
      });
    }else{
      return false;
    }

  }

  this.getVarsVal = function(vars){
    if(Array.isArray(vars)){
      var v = {};
      for(var i=0;i < vars.length;i++){

        v[vars[i]] = this.pureData[vars[i]];
      }
      return v;
    }else{
      return this.pureData[vars];
    }
  }

  /**
  Parse loops : repeat content between {{@loop}} and {{@end}} by the length of the father object
  [in this @version 0.1 all objects in the loop must have the same length]
  @todo support multiobjects length
  and replace vars by his values in @see this.pureData .
  */
  this.parseLoops = function(){

    // get all loops in source code.
    this.getCommand('loop',true);

    // all processering loops is here!
    this.loop.final = [];


    // ok Start ! : end by last loop we found in the source code!
    for (var i = 0; i < this.loop.length; i++) {

      // get vars in this loop
      vars = this.getVars(this.loop.text[i]);

      // get name of the father object : why? for repeat loop content by his length

      var times;
      if(this.loop.attrs && this.loop.attrs[i] && this.loop.attrs[i]['times']){
        times = this.loop.attrs[i]['times'];
      }else{
        times = this.data[vars[0].split(".")[0]].length;
      }


      // out detected loop! , here we repeat it then join(' ') in @see this.compile() function
      this.loop.final[i] = [];

      // ok start loop for repeat the content!
      for (var x = 0; x < times; x++) {
        // push the repeat!
        this.loop.final[i].push(this.loop.text[i]);

        // replece all vars
        for (var v = 0; v < vars.length; v++) {

          // pass some HelperVariables like : {}
          if(this.isHelperVar(vars[v])){
            name = vars[v].split('.')[1];
            switch (name) {
              case 'count':
              val = x;
              break;
              default:

            }
            this.loop.final[i][x] = this.loop.final[i][x].replace(new RegExp("{{" + vars[v] + "}}", "ig"),val);
          }else{

            // generate a key of var value in @see this.pureData
            var kv = vars[v].replace('.','.'+x+'.');

            // the key of var in source @see this.src
            var k = vars[v];
            var val = this.pureData[kv] === undefined ? '' : this.pureData[kv];
            // ok here we replace it and put the new value in out loop.
            this.loop.final[i][x] = this.loop.final[i][x].replace(new RegExp("{{" + k + "}}", "ig"),val);
          }

        }

      }
    }

    // returh all processering loop
    return this.loop.final;
  }

  this.parseIfs = function(){

    this.getCommand('if',true);

    this.if.final = [];
    console.log(this.if.length);
    for (var i = 0; i < this.if.length; i++) {
      var result = null;
      console.log('my if '+ this.if[i]);
      var isMulti = ( (this.if.attrs[i][0].indexOf('||') > -1) || (this.if.attrs[i][0].indexOf('&&') > -1) ) ? true : false;
      console.log(isMulti);
      if(isMulti){
        var soWhat = (this.if.attrs[i][0].indexOf('||') > -1) ? 'or' : 'and';
        var conditions;
        switch (soWhat) {
          case 'or':
            conditions = this.if.attrs[i][0].split('||');
            break;
          case 'and':
            conditions = this.if.attrs[i][0].split('&&');
            break;
        }
        for (var c = 0; c < conditions.length; c++) {
          var x = this.parseIfConditions(conditions[c]);
          console.log(x);
          switch (soWhat) {
            case 'and':
            console.log('and :'+x);
            // and all must be true
              if(x == false){
                result = false;break;
              }else{
                result = true;
              }
              break;
            case 'or':
            console.log('hELRE!' + x);
            // or if have one true the result will be true.
              if(x == true){
                result = true;break;
              }else{
                result = false;
              }
          }
          //result = false;
        }
      }else{
        result = this.parseIfConditions(this.if.attrs[i][0]);
      }
      console.log('If : '+this.if[i]+ ' , result : '+result);
      if(result == false){
        console.log(i);
        this.src = this.src.replace(this.if[i],this.getElse(this.if[i]));
        //this.if.splice(i,1);
        //console.log(this.if);
      }else{
        this.if.final.push([this.if[i],this.if.text[i]]);
        console.log(this.if.final);
      }
    }
    console.log(this.if.final);
  }

  this.parseIfConditions = function(cond){
    var opreators = ['==','!=','>','<','<=','>='];
    var cArr = cond.trim().split(' ');
    console.log(cArr);
    if(cArr.length == 3){
      var op = cArr[1];
      if(opreators.indexOf(op) > -1){
        if(/#(.*)/.test(cArr[0]) || /#(.*)/.test(cArr[2])){
          var whichOne = /#(.*)/.test(cArr[0]) ? 0 : 2;
          cArr[whichOne] = this.getVarsVal(cArr[whichOne].replace('#',''));
        }
        console.log(cArr[0] + cArr[2]);
        switch (op) {
          case '==':
            return cArr[0] == cArr[2];
            break;
          case '!=':
            return cArr[0] != cArr[2];
            break;
          case '>':
            return cArr[0] > cArr[2];
            break;
          case '<':
            return cArr[0] < cArr[2];
            break;
          case '<=':
            return cArr[0] <= cArr[2];
            break;
          case '>=':
            return cArr[0] >= cArr[2];
            break;
        }
        //return eval(string)
      }else{
          throw new SyntaxError('if Condition Error!')
      }
    }else{
      throw new SyntaxError('if Condition Error!');
    }
  }

  this.getElse = function(src){
    patt = '\{\{\@else\}\}([\\s\\S]*?)\{\{\@end\}\}';
    patt = new RegExp(patt,'gi');
    console.log(src);
    if(patt.test(src))
      return src.match(patt)[0].replace(new RegExp('\{\{\@' + 'else' + '\}\}','gi'),'').replace(/\{\{\@end\}\}/gi,'').trim();
    else
      return null
  }
  /**
  Check if variable is helper variable
  @see this.helperVars
  */
  this.isHelperVar = function(v){
    if(v.indexOf('.')){
      var sv = v.split('.');
      if(this.HelperVars[sv[0]] && this.HelperVars[sv[0]].indexOf(sv[1]) > -1){
        return true;
      }
    }
    return false;
  }
  /**
  Parse Vars: replace vars in @see this.src with his value in pureData
  [VARS IN LOOPS NOT REPLECE HERE!]
  */
  this.parseVars = function(){
    for(var k in this.pureData){
      this.src = this.src.replace(new RegExp("{{" + k + "}}", "ig"),this.pureData[k]);
    }
  }
  /**
  MAIN FUNCTION!
  Compile all .. thend return the compileSource..
  */
  this.compile = function(){
    // data after processering : itz open objects and give every object element a uniqe key
    if(this.src.trim().length < 1){
      return console.error('Empty Source..');
    }
    this.pureData = this.prD(this.data);
    this.parseIfs();
    this.parseLoops();

    for(var l=0;l < this.loop.length;l++){
      this.src = this.src.replace(this.loop[l],this.loop.final[l].join(''));
    }
    for (var i = 0; i < this.if.final.length; i++) {
      this.src = this.src.replace(this.if.final[i][0],this.if.final[i][1]);
    }
    this.parseVars();

    console.log( this.src  );

    return this.src;
  }

  return this.compile();

}
