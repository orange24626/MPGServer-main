import moment from "moment";

export const getIsoTime = (timestamp: number | string | null | undefined)=>{
    
    if(!timestamp) return new Date()

    if(!moment(Number(timestamp)).isValid()) return new Date()
    
    if(String(timestamp).length === 10) return new Date(Number(timestamp)*1000)

    if(String(timestamp).length === 13) return new Date(Number(timestamp))

    return new Date()
}