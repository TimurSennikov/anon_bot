const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');

const { UserData, Message, Filters} = require("./classes");

const config = require("./config");

const bot = new Telegraf("7064420754:AAGCmvwTsrHTmaBuPY486YztMUevEfbshQg");
const userData = new UserData();
const filters = new Filters();

async function checkAdmin(ctx){
    try{
        let member = await bot.telegram.getChatMember(config.channelID, ctx.from.id);
        if(!config.permittedRoles.includes(member.status)){ctx.reply("Недостаточно прав!"); return false;}
        else{return true;}
    }
    catch(e){
        return false;
    }
}

async function getRole(ctx){
    try{
        let member = await bot.telegram.getChatMember(config.channelID, ctx.from.id);
        return member.status;
    }
    catch(e){
        return false;
    }
}

bot.command("filter", async (ctx) => {
    if(!(await checkAdmin(ctx))){return;}

    let word = Message.getArg(ctx, "filter").trim();

    if(word.length < 1){ctx.reply("Введите валидный банворд."); return;}

    filters.addOrUpdate(word, config.ban_duration);

    ctx.reply("Добавлено!");
});

bot.command("dontfilter", async (ctx) => {
    if(!(await checkAdmin(ctx))){return;}

    let word = Message.getArg(ctx, "dontfilter").trim();

    if(word.length < 1){ctx.reply("Введите валидный банворд."); return;}

    if(filters.delete(word)){
        ctx.reply("Слово удалено из списка банвордов.");
    }
    else{
        ctx.reply("Слово не найдено в списке банвордов.");
    }
});

bot.command("filters", (ctx) => {
    ctx.reply(filters.toString());
});

bot.on(message("text"), async (ctx) => {
    let name = "Анонимно";
    let text;

    if(ctx.message.text.startsWith("/")){return;}
    else if(ctx.message.text.startsWith("!")){name = ctx.message.text.split("!")[1]; text = ctx.message.text.split("!")[2];}
    else{text = ctx.message.text;}

    if(!checkAdmin(ctx) && filters.moderate(ctx)){return;}
    if(!(await getRole(ctx))){name += " Нет в чате";}

    let loginDiff = userData.loginDiff(ctx.from.id);

    if(loginDiff >= config.delay || loginDiff === -1){
        bot.telegram.sendMessage(config.channelID, `${name}: ` + text);
        userData.setLastMessage(ctx.from.id);
    }
    else{
        ctx.reply(`Подождите еще ${Math.floor((config.delay - loginDiff) / 1000)} секунд/ы до отправки сообщения.`);
    }
});

bot.on(message("photo"), (ctx) => {
    let loginDiff = userData.loginDiff(ctx.from.id);

    if(loginDiff >= config.delay || loginDiff === -1){
        ctx.telegram.sendPhoto(config.channelID, ctx.message.photo[0].file_id, {
            caption: "Анонимно: " + ctx.message.caption
        });

        userData.setLastMessage(ctx.from.id);
        console.log(ctx.message.caption);
    }
    else{
        ctx.reply(`Подождите еще ${Math.floor((config.delay - loginDiff) / 1000)} секунд/ы до отправки сообщения.`);
    }
});

bot.on(message("sticker"), (ctx) => {
    let loginDiff = userData.loginDiff(ctx.from.id);

    if(loginDiff >= config.sticker_delay || loginDiff === -1){
        ctx.telegram.sendSticker(config.channelID, ctx.message.sticker.file_id);
        userData.setLastMessage(ctx.from.id);
    }
    else{
        ctx.reply(`Подождите еще ${Math.floor((config.sticker_delay - loginDiff) / 1000)} секунд/ы до отправки сообщения.`);
    }
});

bot.on(message("voice"), (ctx) => {
    let loginDiff = userData.loginDiff(ctx.from.id);

    if(loginDiff >= config.voice_delay || loginDiff === -1){
        ctx.telegram.sendVoice(config.channelID, ctx.message.voice.file_id);
        userData.setLastMessage(ctx.from.id);
    }
    else{
        ctx.reply(`Подождите еще ${Math.floor((config.voice_delay - loginDiff) / 1000)} секунд/ы до отправки сообщения.`);
    }
});

bot.launch();

process.on("SIGINT", () => {
    console.log();
    bot.stop();
    console.log("Exiting...");
});