export const matchEmail = (match: string)=>{
return /^\S+@\S+\.\S+$/.test(match)
}

export const matchPhone = (match: string)=>{
return /^(0){10}$/.test(match);
}
