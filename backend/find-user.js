const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_NhRsyf3cWZv1@ep-morning-queen-az2lfhe5-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});
async function main() {
  await client.connect();
  const res = await client.query('SELECT id, email, full_name, role, phone, is_locked, created_at FROM users WHERE role !=  ORDER BY created_at DESC LIMIT 10', ['CUSTOMER']);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main().catch(console.error);
