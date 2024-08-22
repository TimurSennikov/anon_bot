const db = require("better-sqlite3")("server.db");

//db.exec("CREATE TABLE users(id NUMBER, lastLogin NUMBER)");

//db.exec("DROP TABLE filters");
//db.exec("CREATE TABLE filters(word TEXT, banDuration NUMBER)");

class UserData{
    #exists(id){
        return (db.prepare("SELECT * FROM users WHERE id = ?").get(id)) == undefined ? false : true;
    }

    getLastMessage(id){
        if(!this.#exists(id)){return 0;}

        let result = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

        return (result == undefined) ? 0 : result.lastLogin;
    }

    setLastMessage(id){
        if(!this.#exists(id)){
            db.prepare("INSERT INTO users VALUES(?, ?)").run(id, Date.now());
        }
        else{
            db.prepare("UPDATE users SET lastLogin = ? WHERE id = ?").run(Date.now(), id);
        }
    }

    loginDiff(id){
        if(!this.#exists(id)){return -1;}
        else{
            let result = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

            result = (result == undefined) ? -1 : Date.now() - result.lastLogin;

            return result;
        }
    }
};

class Filters{
    #exists(word){
        return (db.prepare("SELECT * FROM filters WHERE word = ?").get(word)) == undefined ? false : true;
    }

    delete(word){
        if(this.#exists(word)){
            db.prepare("DELETE FROM filters WHERE word = ?").run(word);
            return true;
        }
        else{
            return false;
        }
    }

    addOrUpdate(word, banDuration){
        if(this.#exists(word)){
            db.prepare("UPDATE filters SET banDuration = ? WHERE word = ?").run(banDuration, word);
        }
        else{
            db.prepare("INSERT INTO filters VALUES(?, ?)").run(word, banDuration);
        }
    }

    getBanDuration(word){
        let words = db.prepare("SELECT * FROM filters").all();

        for(let miniWord of words){
            if(word.includes(miniWord.word.toLowerCase())){
                return miniWord.banDuration;
            }
        }

        return -1;
    }

    moderate(ctx){
        if(this.getBanDuration(ctx.message.text.toLowerCase()) != -1){ctx.reply("В тексте обнаружен банворд."); console.log("FAIL"); return true;}
        else{
            return false;
        }
    }
};

Filters.prototype.toString = function(){
    let message = "";

    for(let i of db.prepare("SELECT * FROM filters").all()){
        message += `${i.word}: ${Math.floor(i.banDuration / 1000)} секунд бана.\n`;
    }

    return message;
};

class Message{
    static getArg(ctx, command){
        return(ctx.message.text.split(command)[1]);
    }
};

module.exports = { UserData, Message, Filters };