const Discord = require('discord.js')
const mysql = require('mysql')

const client = new Discord.Client()

const prefix = "$$"
const balance_check = "SELECT balance FROM users WHERE user_id = ?"
const user_checking = "SELECT * FROM users WHERE user_id = ?"
const user_init = "INSERT INTO users VALUES (?, ?)"
const update_balance = "UPDATE users SET balance = ? WHERE user_id = ?"
const table_creation = `CREATE TABLE IF NOT EXISTS users (
    user_id varchar(32) NOT NULL,
    balance int
)`
const help = `here are all the available commands:
    Prefix is $$ for each command.
    ping: Replies with Pong!
    init: Initializes your account with 1000 credits.
    b / bal / balance: Shows your current balance.
    flip {value} {heads/tails}: Bet your money to gain double or lose all.
`
var connection = mysql.createConnection(process.env.JAWSDB_URL)
connection.connect()

client.on('ready', () => {
    // Database time!
    connection.query(table_creation, err => {
        if (err) {
            console.error(err)
        }
    })
    console.log('I am ready!')
})

client.on('disconnect', event => {
    connection.end()
})

client.on('message', message => {
    var content = message.content.split(' ')
    if (content.length > 0) {
        if (content[0] === prefix) {
            for (let i = 0; i < content.length; i++) {
                content[i] = content[i].toLowerCase()
            }
            if (content.length === 1) {
                message.reply(help)
            }
            if (content[1] === "ping") {
                message.reply("Pong!")
            } else if (content[1] === "init") {
                connection.query(user_checking, [message.author.id], function (error, results, fields) {
                    if (error) {
                        console.log(error)
                        message.reply("An error occured. Please try again later.")
                        return
                    }
                    if (results.length > 0) {
                        connection.query(user_init, [message.author.id, 1000], function (error) {
                            if (error) {
                                console.log(error)
                                message.reply("An error occured. Please try again later.")
                                return
                            } else {
                                message.reply("Money reverted back to 1000!")
                            }
                        })
                    } else {
                        connection.query(user_init, [message.author.id, 1000], function (error) {
                            if (error) {
                                console.log(error)
                                message.reply("An error occured. Please try again later.")
                                return
                            } else {
                                message.reply("Account initialized!")
                            }
                        })
                    }
                })
            } else if (content[1] === "balance" || content[1] === "bal" || content[1] === "b") {
                connection.query(balance_check, [message.author.id], function (error, results, fields) {
                    if (error) {
                        console.log(error)
                        message.reply("An error occured. Please try again later.")
                        return
                    }
                    if (results.length > 0) {
                        let bal = results[0].balance
                        message.reply(`Your balance is ${bal} credits.`)
                    } else {
                        message.reply("You have not initialized your account! Initialize with $$ init.")
                    }
                })
            } else if (content[1] === "flip") {
                if (content.length < 3) {
                    message.reply("Please input the amount you want to bet.")
                } else {
                    if (isNaN(content[2])) {
                        message.reply("Please input a valid number!")
                    } else {
                        connection.query(balance_check, [message.author.id], function (error, results, fields) {
                            if (error) {
                                console.error(error)
                                message.reply("An error occured. Please try again later.")
                                return
                            }
                            if (results.length > 0) {
                                current_money = results[0].balance
                                if (typeof current_money != "number") {
                                    message.reply("An error occured. Please try again later.")
                                    return
                                }
                                let bet_value = parseInt(content[2])
                                let bet = "heads"
                                if (content.length >= 4) {
                                    if (content[3].toLowerCase() == "tails") bet = "tails"
                                }
                                if (current_money < bet_value) {
                                    message.reply(`You do not have enough money. Your balance is ${current_money} credits, while your bet was ${bet_value} credits.`)
                                    return
                                }
                                let result = Math.random() >= 0.5 ? "heads" : "tails"
                                if (result === bet) {
                                    message.reply(`You bet ${bet} and the results was ${result}. You won ${bet_value * 2} credits!`)
                                    current_money += bet_value
                                } else {
                                    message.reply(`You bet ${bet} and the results was ${result}. You lost ${bet_value} credits!`)
                                    current_money -= bet_value
                                }
                                connection.query(update_balance, [current_money, message.author.id], function (error, result) {
                                    if (error) {
                                        console.error(error)
                                    }
                                })
                            } else {
                                message.reply("You have not initialized your account! Initialize with $$ init.")
                            }
                        })
                    }
                }
            }
        } else {
            return
        }
    }
})

client.login(process.env.BOT_TOKEN)