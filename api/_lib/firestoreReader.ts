const PROJECT_ID = 'noted-tribute-z22vb';
const DATABASE_ID = 'ai-studio-gudangkita-d5ae6977-de57-4f0e-9eb9-30b130c3a06a';

function decodeValue(value: any): any {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}
function decodeFields(fields: Record<string, any>) {
  return Object.fromEntries(Object.entries(fields).map(([k,v]) => [k, decodeValue(v)]));
}
async function idToken() {
  const apiKey=process.env.FIREBASE_WEB_API_KEY, email=process.env.GUDANGKITA_READER_EMAIL, password=process.env.GUDANGKITA_READER_PASSWORD;
  if(!apiKey||!email||!password) throw new Error('Reader credentials are not configured');
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
  if(!r.ok) throw new Error('Firebase reader authentication failed');
  return ((await r.json()) as {idToken:string}).idToken;
}
export async function readCollection(name:string){
  const token=await idToken();
  const url=`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${name}`;
  const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
  if(!r.ok) throw new Error('Firestore read failed');
  const p=(await r.json()) as {documents?:Array<{fields?:Record<string,any>}>};
  return (p.documents||[]).map(d=>decodeFields(d.fields||{}));
}
