import Discord from 'discord.js'
import XLSX from 'xlsx'

import path from 'path'

const readChannelId = '315969923371499520'
const writeChannelId = '315969923371499520'

export default class Bot {
  constructor (botToken) {
    this.main = this.main.bind(this)

    this.botToken = botToken

    this.client = new Discord.Client()
    this.client.on("ready", async () => {
            //this.client.user.setGame('live guild member times')
            this.client.user.setActivity('live guild member times')
      this.readChannel = this.client.channels.get(readChannelId)
      this.writeChannel = this.client.channels.get(writeChannelId)

      this.initializeBot()
      console.log('Bot initialized')
    })

    this.client.login(botToken)

    this.sheet = XLSX.utils.sheet_to_json(XLSX.readFile(path.resolve(__dirname, '../SWGoH_Shard.xlsx')).Sheets.Sheet1)

    this.parseXlsx()


    console.log('spreadsheet parsed')
    this.main()
  }

  async main () {
    try {
      if (this.message) {
        this.calculateCurrentTimes()
        await this.sendMessage()
      }
    } catch (err) {
      console.log(err)
      console.log("set timeout")
      setTimeout(this.main, 2000)
    } finally {
      setTimeout(this.main, 60000 - Date.now() % 60000)
      
    }
  }

  async initializeBot () {
    // fetch message. create a new one if necessary
    const messages = await this.writeChannel.fetchMessages()
    if (messages.array().length === 0) {
      try {
        this.message = await this.writeChannel.send({embed: new Discord.RichEmbed()})
      } catch (err) {
        console.log(err)
      }
    } else {
      if (messages.first().embeds.length === 0) {
        await messages.first().delete()
        this.message = await this.writeChannel.send({embed: new Discord.RichEmbed()})
      } else {
        this.message = messages.first()
      }
    }
  }

  parseXlsx () {
    this.mates = []
    for (let i in this.sheet) {
      const user = this.sheet[i]
      this.mates.push({
        name: user.Name,
        payout: parseInt(user.UTC.substr(0,2)),
        discordId: user.Discord,
        flag: user.Flag,
        swgoh: user.SWGOH,
        offset: user.Offset
      })
    }
 
    const matesByTime = {}
    for (let i in this.mates) {
      const mate = this.mates[i]
      if (!matesByTime[mate.offset]) {
        matesByTime[mate.offset] = {
          offset: mate.offset,
          mates: []
        }
      }
      matesByTime[mate.offset].mates.push(mate)
    } 
    this.mates = Object.values(matesByTime)
  }



calculateCurrentTimes () {
    const now = new Date()
    for (let i in this.mates) {
      const mate = this.mates[i]
      const p = new Date()
      p.setHours(p.getHours() - mate.offset)
     
      
      mate.time = `${String(p.getUTCHours()).padStart(2, '00')}:${String(p.getUTCMinutes()).padStart(2, '00')}`
    }
    this.mates.sort((a, b) => {
        if (( a.offset <= -1 ) && ( b.offset <= -1) ) {
            if ( a.offset < b.offset ) {
              return 1
            } else if ( a.offset == b.offset ) {
              return 0
            } else {
              return -1
            }
        }
        if ( a.offset < b.offset ) {
            return -1
        } else if ( a.offset == b.offset ) {
            return 0
        } else {
            return 1
        }
    })
  }


  async sendMessage () {
    let embed = new Discord.RichEmbed().setColor(0x00AE86).setThumbnail('https://swgoh.gg/static/img/swgohgg-nav.png')
    let desc = '**Current time for guild members**:'
    for (let i in this.mates) {
      desc += `\n\`${this.mates[i].time}\`   `
      for (let j in this.mates[i].mates) {
        const mate = this.mates[i].mates[j]
        //desc += `${mate.flag} [${mate.name}]   `
         //desc += `${mate.flag} [${mate.name}](${mate.swgoh})   `

            if (mate.swgoh) {
                desc += ` [${mate.name}](${mate.swgoh})   `
               
            } else {
                desc += ` ${mate.name}   `
            }
      }
    }
    embed.setDescription(desc)
    await this.message.edit({embed})
  }
}
