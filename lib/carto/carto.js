/*
 * CartoDB helper function
 */

import * as cartodb from "cartodb";
export default function carto() {

  function carto(){

  }

  carto.query = function(config, callback){
    //Config the cartdb User
    var sql = new cartodb.SQL({ user: config.cartodb.user });
    //Execute the query
    sql.execute(config.cartodb.sql)
      .done(function(data){

        var result = data.rows;
        //parse the data
        if( config.parser ){
          result = data.rows.map(config.parser)
        }
        //execute the callback with no error
        callback(null, result);
      })
      .error(function(error){
        //Return the error
        callback(error, null);
      })
  }

  return carto;
}
