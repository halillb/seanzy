import forge from 'node-forge'
import { writeFileSync, mkdirSync } from 'fs'
import { randomBytes } from 'crypto'

mkdirSync('keystore-output', { recursive: true })

function randomPass(len = 24) {
  return randomBytes(len).toString('base64').replace(/[+/=]/g, '').slice(0, len)
}

const storePass = randomPass()
const keyPass = randomPass()
const alias = 'seanzy'

// 1) RSA anahtar çifti + kendinden imzalı sertifika üret (25 yıl geçerli — Google Play zorunlu minimum)
const keys = forge.pki.rsa.generateKeyPair(2048)
const cert = forge.pki.createCertificate()
cert.publicKey = keys.publicKey
cert.serialNumber = '01'
cert.validity.notBefore = new Date()
cert.validity.notAfter = new Date()
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 27)

const attrs = [
  { name: 'commonName', value: 'Seanzy' },
  { name: 'organizationName', value: 'Seanzy' },
  { shortName: 'OU', value: 'Seanzy Mobile' },
  { name: 'countryName', value: 'TR' },
]
cert.setSubject(attrs)
cert.setIssuer(attrs)
cert.sign(keys.privateKey, forge.md.sha256.create())

// 2) PKCS12 keystore'a paketle (Android release signing PKCS12 formatını destekler)
const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], storePass, {
  friendlyName: alias,
  algorithm: '3des',
})
const p12Der = forge.asn1.toDer(p12Asn1).getBytes()
writeFileSync('keystore-output/seanzy-release.p12', Buffer.from(p12Der, 'binary'))

// 3) Base64 (Codemagic ortam değişkeni olarak dosya yerine metin yapıştırmak için)
const b64 = Buffer.from(p12Der, 'binary').toString('base64')
writeFileSync('keystore-output/seanzy-release.p12.base64.txt', b64)

writeFileSync('keystore-output/BILGILER.txt', `Seanzy Android İmzalama Anahtarı — Codemagic Environment Variables

Bu değerleri Codemagic'te "Environment variables" sekmesinden,
grup adı "android_signing" olacak şekilde ekleyin (her biri "Secure" işaretli):

CM_KEYSTORE_PASSWORD = ${storePass}
CM_KEY_ALIAS         = ${alias}
CM_KEY_PASSWORD      = ${keyPass}
CM_KEYSTORE          = (seanzy-release.p12.base64.txt dosyasının TAM içeriğini yapıştırın)

ÖNEMLİ: Bu dosyaları güvenli saklayın — kaybolursa uygulamanın Google Play/AppGallery
güncellemeleri bir daha yayınlanamaz (yeni anahtarla eski uygulamanın üzerine yazılamaz).
`)

console.log('Keystore parolası:', storePass)
console.log('Key parolası:', keyPass)
console.log('Alias:', alias)
console.log('✓ keystore-output/ klasörüne yazıldı')
