import fs, { mkdirSync } from 'fs'

import sql from "../src/utils/db";

const Tables = [ 
    // 'GameHistory', 
    // 'GameHistory_20240418', 
    // 'GameHistory_20240419', 
    // 'GameHistory_20240420', 
    // 'GameHistory_20240421', 
    // 'GameHistory_20240422', 
    // 'GameHistory_20240423', 
    // 'GameHistory_20240424', 
    // 'GameHistory_20240425', 
    // 'GameHistory_20240426', 
    // 'GameHistory_20240427',
    'GameHistory_20240428',
    'GameHistory_20240429',
]

const limit = 5000

let errorCount = 0

const starTime = Date.now()

const action = process.argv[2]

const FILEDIR = `${__dirname}/../log/${starTime}_${ action ? action : 'check' }`

const LINEMAP = { 68: 5, 98: 10, 126: 5, 1543462: 10, 1695365: 5 }

console.log(FILEDIR)

if(!fs.existsSync(FILEDIR)){

    mkdirSync(FILEDIR, {recursive: true})
}

let tableName = ''

const checkHistory = async (item: any)=>{

    try{

        const totalBet = Number(item.totalBet)
        
        let totalWin = 0

        if(item.gameID===1695365){

            if(item.detail && item.detail.length) totalWin = item.detail.reduce((total: number, curr: any) => { return total + curr.gd.ctw }, 0)

        }else{

            if(item.detail && item.detail.length) totalWin = item.detail.sort((a: { gd: any; }, b: { gd: any; })=>(b.gd.aw - a.gd.aw))[0].gd.aw 
        }

        const correct = Number(totalWin - totalBet).toFixed(2)

        const profit = Number(item.profit).toFixed(2)

        if(correct!==profit && !(Math.abs(Number(correct))===0 && Math.abs(Number(profit))===0)){

            errorCount++
            
            const content = `historyId：${ item.historyId } 数据统计有误：playerId ${ item.playerId } gameID ${ item.gameID } totalWin ${totalWin} totalBet ${ totalBet } profit ${ profit } 正确利润 ${ correct }\n`

            fs.appendFileSync(`${FILEDIR}/${tableName}.txt`, content, 'utf8');

            if(action==='update'){

                if(tableName==='GameHistory') await sql`update "public"."GameHistory" set "profit" = ${ correct } where "historyId"=${ item.historyId }`
                
                if(tableName==='GameHistory_20240418') await sql`update "public"."GameHistory_20240418" set "profit" = ${ correct } where "historyId"=${ item.historyId }`
                
                if(tableName==='GameHistory_20240419') await sql`update "public"."GameHistory_20240419" set "profit" = ${ correct } where "historyId"=${ item.historyId }`
                
                if(tableName==='GameHistory_20240420') await sql`update "public"."GameHistory_20240420" set "profit" = ${ correct } where "historyId"=${ item.historyId }`
                
                if(tableName==='GameHistory_20240421') await sql`update "public"."GameHistory_20240421" set "profit" = ${ correct } where "historyId"=${ item.historyId }`
                
                if(tableName==='GameHistory_20240422') await sql`update "public"."GameHistory_20240422" set "profit" = ${ correct } where "historyId"=${ item.historyId }`
                
                if(tableName==='GameHistory_20240423') await sql`update "public"."GameHistory_20240423" set "profit" = ${ correct } where "historyId"=${ item.historyId }`
                
                if(tableName==='GameHistory_20240424') await sql`update "public"."GameHistory_20240424" set "profit" = ${ correct } where "historyId"=${ item.historyId }`
                
                if(tableName==='GameHistory_20240425') await sql`update "public"."GameHistory_20240425" set "profit" = ${ correct } where "historyId"=${ item.historyId }`

                if(tableName==='GameHistory_20240426') await sql`update "public"."GameHistory_20240426" set "profit" = ${ correct } where "historyId"=${ item.historyId }`

                if(tableName==='GameHistory_20240427') await sql`update "public"."GameHistory_20240427" set "profit" = ${ correct } where "historyId"=${ item.historyId }` 

                if(tableName==='GameHistory_20240428') await sql`update "public"."GameHistory_20240428" set "profit" = ${ correct } where "historyId"=${ item.historyId }` 

                if(tableName==='GameHistory_20240429') await sql`update "public"."GameHistory_20240429" set "profit" = ${ correct } where "historyId"=${ item.historyId }` 

                fs.appendFileSync(`${FILEDIR}/${tableName}.txt`, `historyId：${ item.historyId } 修正成功\n`, 'utf8');
            }
        }

    }catch(error){

        console.log('checkHistory', error)
    }
}

const checkBet = async (item: any)=>{

    try{

        if(!item.totalBet || !item.detail.length) return

        const { ml, cs, fb } = item.detail[0].gd

        const lines = LINEMAP[item.gameID as 68 | 98 | 126 | 1543462 | 1695365 ]

        const totalBet = ml * cs * lines * ((Number(fb)===2 && item.gameID===1695365) ? 5 : 1)

        if(totalBet.toFixed(2)!==Number(item.totalBet).toFixed(2)){

            errorCount++

            const content = `historyId：${ item.historyId } 投注有误：playerId ${ item.playerId } gameID ${ item.gameID } fb ${ fb } ml ${ml} cs ${cs} lines ${lines} 记录投注额 ${ item.totalBet } 正确投注额 ${totalBet}\n`

            fs.appendFileSync(`${FILEDIR}/${tableName}.txt`, content, 'utf8');
        }

    }catch(error){
        
        console.log('checkBet', error)
    }
}

const getHistory = async ()=>{

    try{

        let page = 1

        while(true){
            
            const skip = (page-1) * limit
            
            // const sql = `SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from public."${ tableName }" where "gameID" in (1695365, 1543462) and "status"='Success' limit ${limit} OFFSET ${skip}`

            // const data = await PgClient.query(sql)

            let data: any[] = []

            //  "gameID" in (1695365, 1543462) and

            if(tableName==='GameHistory') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory" where "status"='Success' limit ${limit} OFFSET ${skip}`
            
            if(tableName==='GameHistory_20240418') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240418" where "status"='Success' limit ${limit} OFFSET ${skip}`
            
            if(tableName==='GameHistory_20240419') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240419" where "status"='Success' limit ${limit} OFFSET ${skip}`
            
            if(tableName==='GameHistory_20240420') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240420" where "status"='Success' limit ${limit} OFFSET ${skip}`
            
            if(tableName==='GameHistory_20240421') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240421" where "status"='Success' limit ${limit} OFFSET ${skip}`
            
            if(tableName==='GameHistory_20240422') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240422" where "status"='Success' limit ${limit} OFFSET ${skip}`
            
            if(tableName==='GameHistory_20240423') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240423" where "status"='Success' limit ${limit} OFFSET ${skip}`

            if(tableName==='GameHistory_20240424') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240424" where "status"='Success' limit ${limit} OFFSET ${skip}`

            if(tableName==='GameHistory_20240425') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240425" where "status"='Success' limit ${limit} OFFSET ${skip}`

            if(tableName==='GameHistory_20240426') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240426" where "status"='Success' limit ${limit} OFFSET ${skip}`

            if(tableName==='GameHistory_20240427') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240427" where "status"='Success' limit ${limit} OFFSET ${skip}`

            if(tableName==='GameHistory_20240428') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240428" where "status"='Success' limit ${limit} OFFSET ${skip}`

            if(tableName==='GameHistory_20240429') data = await sql`SELECT "playerId", "gameID", "historyId", "totalBet", "profit", "detail" from "public"."GameHistory_20240429" where "status"='Success' limit ${limit} OFFSET ${skip}`

            for (let index = 0; index < data.length; index++) {
                
                if(action==='check_bet'){

                    await checkBet(data[index])

                }else{

                    await checkHistory(data[index])
                }
            }

            if(data.length===limit){

                page++
            
            }else{

                break
            }
        }

    }catch(error){

        throw error
    }
}

const main = async ()=>{

    for (let index = 0; index < Tables.length; index++) {
        
        tableName = Tables[index]

        try{

            await getHistory()

        }catch(error){

            console.log(error)

            continue
        
        }

        fs.appendFileSync(`${FILEDIR}/${tableName}.txt`, `${ action==='update' ? '修正数据数量' : '检索数据数量' }: ${errorCount}\n`, 'utf8');

        errorCount = 0

    }

    console.log(`生成日志目录：${FILEDIR}`)

    process.exit()
}

main()