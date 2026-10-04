// The bundler's require.context, which Root.tsx uses to find the videos.
declare namespace NodeJS {
  interface Require {
    context(
      directory: string,
      recursive: boolean,
      filter: RegExp,
    ): {
      keys(): string[];
      <T>(id: string): T;
    };
  }
}
