// TODO: Write this appropriately for your server.
export class DateParser {
  public static fromServer(str: string): any {
    return new Date(str);
  }

  public static forServer(date: Date): string {
    return String(date);
  }
}
