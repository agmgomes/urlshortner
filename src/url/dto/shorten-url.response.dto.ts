export class ShortenUrlResponse {
    readonly url: string;

    private constructor(url: string) {
        this.url = url;
    }

    static create(url: string): ShortenUrlResponse {
        return new ShortenUrlResponse(url);
    }
}