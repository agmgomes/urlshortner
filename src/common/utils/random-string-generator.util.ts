import * as randomstring from 'randomstring';

export default function randomStr(minLength: number, maxLength: number) : string {
    if(minLength < 0 || maxLength <0) {
        throw new Error("minLength and MaxLength can't be negative");
    }

    if(minLength > maxLength){
        throw new Error("minLength can't be greater than maxLength");
    }

    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    return randomstring.generate({
        length,
        charset: 'alphanumeric'
    });
}