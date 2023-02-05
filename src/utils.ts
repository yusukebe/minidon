export function stob(s: string) {
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

export function btos(b: ArrayBuffer) {
  return String.fromCharCode(...new Uint8Array(b))
}

export async function importprivateKey(pem: string) {
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  if (pem.startsWith('"')) pem = pem.slice(1)
  if (pem.endsWith('"')) pem = pem.slice(0, -1)
  pem = pem.split('\\n').join('')
  pem = pem.split('\n').join('')
  const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length)
  const der = stob(atob(pemContents))
  const r = await crypto.subtle.importKey(
    'pkcs8',
    der,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    true,
    ['sign']
  )
  return r
}

export async function privateKeyToPublicKey(key: CryptoKey) {
  const jwk = await crypto.subtle.exportKey('jwk', key)
  if ('kty' in jwk) {
    delete jwk.d
    delete jwk.p
    delete jwk.q
    delete jwk.dp
    delete jwk.dq
    delete jwk.qi
    delete jwk.oth
    jwk.key_ops = ['verify']
  }
  const r = await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    true,
    ['verify']
  )
  return r
}

export async function exportPublicKey(key: CryptoKey) {
  const der = await crypto.subtle.exportKey('spki', key)
  if ('byteLength' in der) {
    let pemContents = btoa(btos(der))

    let pem = '-----BEGIN PUBLIC KEY-----\n'
    while (pemContents.length > 0) {
      pem += pemContents.substring(0, 64) + '\n'
      pemContents = pemContents.substring(64)
    }
    pem += '-----END PUBLIC KEY-----\n'
    return pem
  }
}
