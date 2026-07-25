import type { SupportedLanguage } from '../../types/analysis.ts'

type Messages = {
  progress: {
    local: string
    ai: string
    reputation: string
    combining: string
    qr: string
  }
  reason: {
    urgency: string
    payment: string
    credential: string
    prize: string
    blacklisted: string
    guardian: string
    shortener: string
    suspiciousTld: string
    lookalike: string
    suspiciousLink: string
  }
  summary: {
    blocked: string
    highRisk: string
    caution: string
    noKnownRisk: string
  }
  action: {
    blocked: string
    highRisk: string
    caution: string
    noKnownRisk: string
  }
  category: {
    phishing: string
    scam: string
    suspicious: string
    safe: string
  }
}

const messages: Record<SupportedLanguage, Messages> = {
  sq: {
    progress: {
      local: 'Po kontrollohet mbrojtja e personalizuar',
      ai: 'Po nxirren lidhjet dhe shenjat e mashtrimit',
      reputation: 'Po kontrollohen të dhënat e kërcënimeve',
      combining: 'Po përgatitet rekomandimi',
      qr: 'Po skanohet kodi QR',
    },
    reason: {
      urgency: 'Përmbajtja ushtron presion për veprim të menjëhershëm.',
      payment: 'Përmbajtja kërkon pagesë ose transferim parash.',
      credential: 'Përmbajtja kërkon të dhëna private të llogarisë.',
      prize: 'Përmbajtja përdor pretendim të dyshimtë për çmim.',
      blacklisted: 'Lidhja gjendet në listën lokale të bllokimit.',
      guardian: 'Lidhja është bllokuar nga Kontrollet e Kujdestarit.',
      shortener: 'Lidhja përdor një shërbim shkurtimi që fsheh destinacionin.',
      suspiciousTld: 'Lidhja përdor një prapashtesë domeni me rrezik të shtuar.',
      lookalike: 'Domeni duket sikur imiton një markë të besuar.',
      suspiciousLink: 'Struktura e lidhjes ka shenja të dyshimta.',
    },
    summary: {
      blocked: 'Kjo përmbajtje përputhet me një kërcënim të bllokuar.',
      highRisk: 'Kjo përmbajtje tregon disa shenja të forta mashtrimi.',
      caution: 'Kjo përmbajtje ka shenja që duhen kontrolluar me kujdes.',
      noKnownRisk: 'Nuk u gjetën shenja të njohura rreziku.',
    },
    action: {
      blocked: 'Mos e hapni lidhjen dhe mos jepni të dhëna personale.',
      highRisk: 'Mos veproni para se ta verifikoni dërguesin në një kanal zyrtar.',
      caution: 'Kontrolloni dërguesin dhe destinacionin e lidhjes para se të vazhdoni.',
      noKnownRisk: 'Mund të vazhdoni me kujdes; kontrolloni gjithmonë domenin.',
    },
    category: {
      phishing: 'Phishing',
      scam: 'Mashtrim',
      suspicious: 'E dyshimtë',
      safe: 'Pa rrezik të njohur',
    },
  },
  en: {
    progress: {
      local: 'Checking custom protection',
      ai: 'Extracting links and scam signals',
      reputation: 'Checking threat intelligence',
      combining: 'Preparing recommendation',
      qr: 'Scanning QR code',
    },
    reason: {
      urgency: 'The content pressures you to act immediately.',
      payment: 'The content requests a payment or money transfer.',
      credential: 'The content requests private account information.',
      prize: 'The content uses a suspicious prize claim.',
      blacklisted: 'The link appears on the local blocklist.',
      guardian: 'The link is blocked by Guardian Controls.',
      shortener: 'The link uses a shortening service that hides its destination.',
      suspiciousTld: 'The link uses a domain suffix associated with elevated risk.',
      lookalike: 'The domain appears to imitate a trusted brand.',
      suspiciousLink: 'The link structure contains suspicious characteristics.',
    },
    summary: {
      blocked: 'This content matches a blocked threat.',
      highRisk: 'This content shows several strong signs of fraud.',
      caution: 'This content contains signs that should be checked carefully.',
      noKnownRisk: 'No known risk signals were found.',
    },
    action: {
      blocked: 'Do not open the link or provide personal information.',
      highRisk: 'Do not act until you verify the sender through an official channel.',
      caution: 'Verify the sender and link destination before continuing.',
      noKnownRisk: 'You may continue carefully and should still verify the domain.',
    },
    category: {
      phishing: 'Phishing',
      scam: 'Scam',
      suspicious: 'Suspicious',
      safe: 'No Known Risk',
    },
  },
  tr: {
    progress: {
      local: 'Özel koruma kontrol ediliyor',
      ai: 'Bağlantılar ve dolandırıcılık işaretleri çıkarılıyor',
      reputation: 'Tehdit verileri kontrol ediliyor',
      combining: 'Öneri hazırlanıyor',
      qr: 'QR kodu taranıyor',
    },
    reason: {
      urgency: 'İçerik hemen harekete geçmeniz için baskı yapıyor.',
      payment: 'İçerik ödeme veya para transferi istiyor.',
      credential: 'İçerik özel hesap bilgileri istiyor.',
      prize: 'İçerik şüpheli bir ödül iddiası kullanıyor.',
      blacklisted: 'Bağlantı yerel engelleme listesinde.',
      guardian: 'Bağlantı Vasi Kontrolleri tarafından engellendi.',
      shortener: 'Bağlantı hedefini gizleyen bir kısaltma hizmeti kullanıyor.',
      suspiciousTld: 'Bağlantı, riski yüksek bir alan adı uzantısı kullanıyor.',
      lookalike: 'Alan adı güvenilir bir markayı taklit ediyor gibi görünüyor.',
      suspiciousLink: 'Bağlantı yapısında şüpheli özellikler var.',
    },
    summary: {
      blocked: 'Bu içerik engellenmiş bir tehditle eşleşiyor.',
      highRisk: 'Bu içerik güçlü dolandırıcılık işaretleri gösteriyor.',
      caution: 'Bu içerik dikkatle kontrol edilmesi gereken işaretler içeriyor.',
      noKnownRisk: 'Bilinen bir risk işareti bulunamadı.',
    },
    action: {
      blocked: 'Bağlantıyı açmayın ve kişisel bilgi vermeyin.',
      highRisk: 'Göndereni resmi bir kanaldan doğrulamadan işlem yapmayın.',
      caution: 'Devam etmeden önce göndereni ve bağlantı hedefini doğrulayın.',
      noKnownRisk: 'Dikkatle devam edebilir, alan adını yine de kontrol etmelisiniz.',
    },
    category: {
      phishing: 'Kimlik avı',
      scam: 'Dolandırıcılık',
      suspicious: 'Şüpheli',
      safe: 'Bilinen Risk Yok',
    },
  },
  sr: {
    progress: {
      local: 'Provera prilagođene zaštite',
      ai: 'Izdvajanje veza i znakova prevare',
      reputation: 'Provera podataka o pretnjama',
      combining: 'Priprema preporuke',
      qr: 'Skeniranje QR koda',
    },
    reason: {
      urgency: 'Sadržaj vrši pritisak da odmah reagujete.',
      payment: 'Sadržaj zahteva plaćanje ili prenos novca.',
      credential: 'Sadržaj traži privatne podatke naloga.',
      prize: 'Sadržaj koristi sumnjivu tvrdnju o nagradi.',
      blacklisted: 'Veza je na lokalnoj listi blokiranih adresa.',
      guardian: 'Vezu su blokirale Roditeljske kontrole.',
      shortener: 'Veza koristi skraćivač koji skriva odredište.',
      suspiciousTld: 'Veza koristi domenski nastavak sa povećanim rizikom.',
      lookalike: 'Domen izgleda kao imitacija pouzdanog brenda.',
      suspiciousLink: 'Struktura veze ima sumnjive karakteristike.',
    },
    summary: {
      blocked: 'Ovaj sadržaj odgovara blokiranoj pretnji.',
      highRisk: 'Ovaj sadržaj pokazuje više jakih znakova prevare.',
      caution: 'Ovaj sadržaj ima znakove koje treba pažljivo proveriti.',
      noKnownRisk: 'Nisu pronađeni poznati znaci rizika.',
    },
    action: {
      blocked: 'Ne otvarajte vezu i ne dajte lične podatke.',
      highRisk: 'Ne reagujte dok ne proverite pošiljaoca zvaničnim kanalom.',
      caution: 'Pre nastavka proverite pošiljaoca i odredište veze.',
      noKnownRisk: 'Možete pažljivo nastaviti, ali ipak proverite domen.',
    },
    category: {
      phishing: 'Fišing',
      scam: 'Prevara',
      suspicious: 'Sumnjivo',
      safe: 'Nema poznatog rizika',
    },
  },
  mk: {
    progress: {
      local: 'Се проверува приспособената заштита',
      ai: 'Се издвојуваат врски и знаци на измама',
      reputation: 'Се проверуваат податоците за закани',
      combining: 'Се подготвува препораката',
      qr: 'Се скенира QR-кодот',
    },
    reason: {
      urgency: 'Содржината ве притиска да дејствувате веднаш.',
      payment: 'Содржината бара плаќање или пренос на пари.',
      credential: 'Содржината бара приватни податоци од сметката.',
      prize: 'Содржината користи сомнително тврдење за награда.',
      blacklisted: 'Врската е на локалната листа за блокирање.',
      guardian: 'Врската е блокирана од Родителските контроли.',
      shortener: 'Врската користи скратувач што ја крие дестинацијата.',
      suspiciousTld: 'Врската користи доменски наставок со зголемен ризик.',
      lookalike: 'Доменот изгледа како да имитира доверлив бренд.',
      suspiciousLink: 'Структурата на врската има сомнителни карактеристики.',
    },
    summary: {
      blocked: 'Оваа содржина се совпаѓа со блокирана закана.',
      highRisk: 'Оваа содржина покажува силни знаци на измама.',
      caution: 'Оваа содржина има знаци што треба внимателно да се проверат.',
      noKnownRisk: 'Не се пронајдени познати знаци на ризик.',
    },
    action: {
      blocked: 'Не отворајте ја врската и не давајте лични податоци.',
      highRisk: 'Не дејствувајте додека не го проверите испраќачот преку официјален канал.',
      caution: 'Проверете го испраќачот и дестинацијата пред да продолжите.',
      noKnownRisk: 'Може внимателно да продолжите, но проверете го доменот.',
    },
    category: {
      phishing: 'Фишинг',
      scam: 'Измама',
      suspicious: 'Сомнително',
      safe: 'Нема познат ризик',
    },
  },
  de: {
    progress: {
      local: 'Individueller Schutz wird geprüft',
      ai: 'Links und Betrugssignale werden ermittelt',
      reputation: 'Bedrohungsdaten werden geprüft',
      combining: 'Empfehlung wird vorbereitet',
      qr: 'QR-Code wird gescannt',
    },
    reason: {
      urgency: 'Der Inhalt drängt zu sofortigem Handeln.',
      payment: 'Der Inhalt verlangt eine Zahlung oder Geldüberweisung.',
      credential: 'Der Inhalt verlangt private Kontodaten.',
      prize: 'Der Inhalt verwendet ein verdächtiges Gewinnversprechen.',
      blacklisted: 'Der Link steht auf der lokalen Sperrliste.',
      guardian: 'Der Link wurde durch die Schutzkontrollen blockiert.',
      shortener: 'Der Link verwendet einen Kürzungsdienst, der das Ziel verbirgt.',
      suspiciousTld: 'Der Link verwendet eine Domainendung mit erhöhtem Risiko.',
      lookalike: 'Die Domain scheint eine vertrauenswürdige Marke nachzuahmen.',
      suspiciousLink: 'Die Linkstruktur enthält verdächtige Merkmale.',
    },
    summary: {
      blocked: 'Dieser Inhalt entspricht einer blockierten Bedrohung.',
      highRisk: 'Dieser Inhalt zeigt mehrere starke Betrugsmerkmale.',
      caution: 'Dieser Inhalt enthält Merkmale, die sorgfältig geprüft werden sollten.',
      noKnownRisk: 'Es wurden keine bekannten Risikosignale gefunden.',
    },
    action: {
      blocked: 'Öffnen Sie den Link nicht und geben Sie keine persönlichen Daten an.',
      highRisk: 'Handeln Sie erst, nachdem Sie den Absender offiziell überprüft haben.',
      caution: 'Prüfen Sie Absender und Linkziel, bevor Sie fortfahren.',
      noKnownRisk: 'Sie können vorsichtig fortfahren und sollten die Domain dennoch prüfen.',
    },
    category: {
      phishing: 'Phishing',
      scam: 'Betrug',
      suspicious: 'Verdächtig',
      safe: 'Kein bekanntes Risiko',
    },
  },
  it: {
    progress: {
      local: 'Controllo della protezione personalizzata',
      ai: 'Estrazione di link e segnali di truffa',
      reputation: 'Controllo delle informazioni sulle minacce',
      combining: 'Preparazione del consiglio',
      qr: 'Scansione del codice QR',
    },
    reason: {
      urgency: 'Il contenuto fa pressione per agire immediatamente.',
      payment: 'Il contenuto richiede un pagamento o un trasferimento di denaro.',
      credential: 'Il contenuto richiede dati privati dell’account.',
      prize: 'Il contenuto usa una promessa di premio sospetta.',
      blacklisted: 'Il link è presente nell’elenco locale dei blocchi.',
      guardian: 'Il link è bloccato dai Controlli tutore.',
      shortener: 'Il link usa un servizio che nasconde la destinazione.',
      suspiciousTld: 'Il link usa un suffisso di dominio a rischio elevato.',
      lookalike: 'Il dominio sembra imitare un marchio affidabile.',
      suspiciousLink: 'La struttura del link presenta caratteristiche sospette.',
    },
    summary: {
      blocked: 'Questo contenuto corrisponde a una minaccia bloccata.',
      highRisk: 'Questo contenuto mostra forti segnali di frode.',
      caution: 'Questo contenuto contiene segnali da verificare con attenzione.',
      noKnownRisk: 'Non sono stati trovati segnali di rischio noti.',
    },
    action: {
      blocked: 'Non aprire il link e non fornire informazioni personali.',
      highRisk: 'Non agire prima di verificare il mittente tramite un canale ufficiale.',
      caution: 'Verifica mittente e destinazione del link prima di continuare.',
      noKnownRisk: 'Puoi continuare con cautela, verificando comunque il dominio.',
    },
    category: {
      phishing: 'Phishing',
      scam: 'Truffa',
      suspicious: 'Sospetto',
      safe: 'Nessun rischio noto',
    },
  },
  fr: {
    progress: {
      local: 'Vérification de la protection personnalisée',
      ai: 'Extraction des liens et indices de fraude',
      reputation: 'Vérification des renseignements sur les menaces',
      combining: 'Préparation de la recommandation',
      qr: 'Analyse du code QR',
    },
    reason: {
      urgency: 'Le contenu vous pousse à agir immédiatement.',
      payment: 'Le contenu demande un paiement ou un transfert d’argent.',
      credential: 'Le contenu demande des informations privées du compte.',
      prize: 'Le contenu utilise une promesse de prix suspecte.',
      blacklisted: 'Le lien figure sur la liste de blocage locale.',
      guardian: 'Le lien est bloqué par le contrôle du responsable.',
      shortener: 'Le lien utilise un service qui masque sa destination.',
      suspiciousTld: 'Le lien utilise une extension de domaine à risque élevé.',
      lookalike: 'Le domaine semble imiter une marque de confiance.',
      suspiciousLink: 'La structure du lien présente des caractéristiques suspectes.',
    },
    summary: {
      blocked: 'Ce contenu correspond à une menace bloquée.',
      highRisk: 'Ce contenu présente plusieurs signes forts de fraude.',
      caution: 'Ce contenu contient des signes à vérifier avec attention.',
      noKnownRisk: 'Aucun signal de risque connu n’a été trouvé.',
    },
    action: {
      blocked: 'N’ouvrez pas le lien et ne donnez aucune information personnelle.',
      highRisk: 'N’agissez pas avant de vérifier l’expéditeur par un canal officiel.',
      caution: 'Vérifiez l’expéditeur et la destination du lien avant de continuer.',
      noKnownRisk: 'Vous pouvez continuer prudemment en vérifiant toujours le domaine.',
    },
    category: {
      phishing: 'Hameçonnage',
      scam: 'Arnaque',
      suspicious: 'Suspect',
      safe: 'Aucun risque connu',
    },
  },
  ar: {
    progress: {
      local: 'جارٍ التحقق من الحماية المخصصة',
      ai: 'جارٍ استخراج الروابط وعلامات الاحتيال',
      reputation: 'جارٍ التحقق من معلومات التهديدات',
      combining: 'جارٍ إعداد التوصية',
      qr: 'جارٍ مسح رمز QR',
    },
    reason: {
      urgency: 'يضغط المحتوى عليك للتصرف فوراً.',
      payment: 'يطلب المحتوى دفعاً أو تحويلاً مالياً.',
      credential: 'يطلب المحتوى معلومات خاصة بالحساب.',
      prize: 'يستخدم المحتوى ادعاءً مشبوهاً بوجود جائزة.',
      blacklisted: 'الرابط موجود في قائمة الحظر المحلية.',
      guardian: 'تم حظر الرابط بواسطة أدوات تحكم ولي الأمر.',
      shortener: 'يستخدم الرابط خدمة اختصار تخفي وجهته.',
      suspiciousTld: 'يستخدم الرابط لاحقة نطاق مرتفعة المخاطر.',
      lookalike: 'يبدو النطاق كأنه يقلد علامة موثوقة.',
      suspiciousLink: 'تحتوي بنية الرابط على خصائص مشبوهة.',
    },
    summary: {
      blocked: 'يتطابق هذا المحتوى مع تهديد محظور.',
      highRisk: 'يظهر هذا المحتوى عدة علامات قوية على الاحتيال.',
      caution: 'يحتوي هذا المحتوى على علامات يجب التحقق منها بعناية.',
      noKnownRisk: 'لم يتم العثور على علامات خطر معروفة.',
    },
    action: {
      blocked: 'لا تفتح الرابط ولا تقدم معلومات شخصية.',
      highRisk: 'لا تتصرف قبل التحقق من المرسل عبر قناة رسمية.',
      caution: 'تحقق من المرسل ووجهة الرابط قبل المتابعة.',
      noKnownRisk: 'يمكنك المتابعة بحذر مع التحقق دائماً من النطاق.',
    },
    category: {
      phishing: 'تصيد احتيالي',
      scam: 'احتيال',
      suspicious: 'مشبوه',
      safe: 'لا يوجد خطر معروف',
    },
  },
  ro: {
    progress: {
      local: 'Se verifică protecția personalizată',
      ai: 'Se extrag linkurile și semnalele de fraudă',
      reputation: 'Se verifică informațiile despre amenințări',
      combining: 'Se pregătește recomandarea',
      qr: 'Se scanează codul QR',
    },
    reason: {
      urgency: 'Conținutul vă presează să acționați imediat.',
      payment: 'Conținutul solicită o plată sau un transfer de bani.',
      credential: 'Conținutul solicită date private ale contului.',
      prize: 'Conținutul folosește o promisiune suspectă de premiu.',
      blacklisted: 'Linkul se află pe lista locală de blocare.',
      guardian: 'Linkul este blocat de Controlul tutorelui.',
      shortener: 'Linkul folosește un serviciu care ascunde destinația.',
      suspiciousTld: 'Linkul folosește un sufix de domeniu cu risc ridicat.',
      lookalike: 'Domeniul pare să imite o marcă de încredere.',
      suspiciousLink: 'Structura linkului are caracteristici suspecte.',
    },
    summary: {
      blocked: 'Acest conținut corespunde unei amenințări blocate.',
      highRisk: 'Acest conținut prezintă semne puternice de fraudă.',
      caution: 'Acest conținut are semne care trebuie verificate atent.',
      noKnownRisk: 'Nu au fost găsite semnale de risc cunoscute.',
    },
    action: {
      blocked: 'Nu deschideți linkul și nu furnizați date personale.',
      highRisk: 'Nu acționați înainte de a verifica expeditorul pe un canal oficial.',
      caution: 'Verificați expeditorul și destinația linkului înainte de a continua.',
      noKnownRisk: 'Puteți continua cu atenție, verificând totuși domeniul.',
    },
    category: {
      phishing: 'Phishing',
      scam: 'Înșelătorie',
      suspicious: 'Suspect',
      safe: 'Niciun risc cunoscut',
    },
  },
}

export function getMessages(language: SupportedLanguage): Messages {
  return messages[language]
}

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  sq: 'Albanian',
  en: 'English',
  tr: 'Turkish',
  sr: 'Serbian',
  mk: 'Macedonian',
  de: 'German',
  it: 'Italian',
  fr: 'French',
  ar: 'Arabic',
  ro: 'Romanian',
}
