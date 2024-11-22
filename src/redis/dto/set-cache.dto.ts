import { IsNotEmpty, IsString } from "class-validator";

export class KeyValueDto {
    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsNotEmpty()
    value: string;
}