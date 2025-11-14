# Grammar Generation

Older versions of antlr4, such as those provided by `apt`, may not work correctly.

`java -jar antlr/antlr-4.13.0-complete.jar -o antlr -encoding utf8 -Dlanguage=JavaScript ProjectDiablo2PropParser.g4`

# Dist Generation

`npm run build`

Output is a single file: `dist/pd2propparser.js`.
