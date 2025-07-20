export type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}` ? `${T}${Capitalize<SnakeToCamelCase<U>>}` : S;

export type AllPaths<T, P extends string = ''> =

  {
  [K in keyof T]: T[K] extends object
    ? T[K] extends any[]
      ? `${P}${K & string}`
      : AllPaths<T[K], `${P}${K & string}.`> extends infer O
        ? `${O & string}` | `${P}${K & string}`
        : never
    : `${P}${K & string}`
}[keyof T]
