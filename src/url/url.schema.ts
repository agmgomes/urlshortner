import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UrlsDocument = HydratedDocument<Url>;

@Schema({collection: 'urls'})
export class Url {
    @Prop({type: String})
    _id: string;

    @Prop()
    fullUrl: string;

    @Prop({type: Date, expires: '0'})
    expiresAt: Date;
}

export const UrlSchema = SchemaFactory.createForClass(Url);