import {readFileSync} from 'node:fs';
import {neon} from '@neondatabase/serverless';
process.loadEnvFile('.env');
const q=neon(process.env.DATABASE_URL);
const businesses=await q`SELECT id FROM business_workspaces WHERE name=${"Ope's TFS · discovery"}`;
if(businesses.length!==1) throw new Error('Expected exactly one UI-created prospect workspace.');
const businessId=businesses[0].id;
for (const file of ['README.md','discovery-brief.md','discovery-questions.md','call-guide.md']) {
 const content=readFileSync('../clients/opes-tfs/'+file,'utf8');
 const title='Imported source · '+file;
 await q`INSERT INTO business_documents(id,business_id,title,kind,content,evidence_status,filename,file_base64) SELECT ${crypto.randomUUID()},${businessId},${title},'research',${content},'unverified',${file},${Buffer.from(content).toString('base64')} WHERE NOT EXISTS (SELECT 1 FROM business_documents WHERE business_id=${businessId} AND title=${title})`;
}
const note='These imported documents preserve the earlier Claude research. They are not client-confirmed. Failure to find an indexed website is not proof that no website exists. A shared phone number does not establish a single legal entity. Follower counts and a single advertised product price do not establish sales, price positioning or budget. Confirm these during discovery before choosing a brand, domain, scope or price. No call outcome, signed contract, invoice or payment is assumed.';
await q`INSERT INTO business_documents(id,business_id,title,kind,content,evidence_status) SELECT ${crypto.randomUUID()},${businessId},'Review notes and evidence limits','note',${note},'internal' WHERE NOT EXISTS(SELECT 1 FROM business_documents WHERE business_id=${businessId} AND title='Review notes and evidence limits')`;
console.log('Imported four client source documents and one evidence review note into the existing prospect workspace.');
