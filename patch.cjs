const fs = require('fs');
let code = fs.readFileSync('src/types/scout.ts', 'utf8');
code = code.replace(
`  payload: {
    scout: ScoutPayload;
    b: null;
    b1: null;
    b2: null;
    b3: null;
    b4: null;
    b5: null;
  };`,
`  payload: {
    scout: ScoutPayload;
    b: null;
    b1: B1Payload | null;
    b2: null;
    b3: null;
    b4: null;
    b5: null;
  };`);

code = code + `
export interface B1Payload {
  processed_source_text: string;
}
`;
fs.writeFileSync('src/types/scout.ts', code);
