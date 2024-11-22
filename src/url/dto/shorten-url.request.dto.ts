import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { IsHttpUrl } from "src/common/decorators/is-http-url.decorator";

export class ShortenUrlRequest {
    @IsNotEmpty()
    @IsHttpUrl()
    url: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    expirationTime: number
}