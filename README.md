# GymSchema

Filips gymschema – program 2.1. Öppna https://filipkymmer79-pixel.github.io/GymSchema/ i Safari på mobilen och välj *Dela → Lägg till på hemskärmen*.

### Programmet

Överkroppen först, benen korta och tunga. **Över** onsdag och lördag (chins, hantelbänkpress, kabelrodd, axelpress, sidolyft, bicepscurl, face pulls). **Ben + över** torsdag och söndag: benpress, vadpress (i benpressen direkt efter), hip thrust och rumänska marklyft, sedan lutande hantelpress, sidolyft, triceps över huvudet med rep i kabel och bicepscurl, sist plankan och dead bug. Uppvärmningen före benen har 3 × 5 upphopp för skelettet. Löpning i pratfart en gång i veckan, på tisdagen (30–40 min). Måndag och fredag är vilodagar. Varje övning har bild, steg för steg, vanliga fel och video under **Program**.

Version 2.1 kom 12 november 2026: dagarna flyttades en dag, lårcurl utgick, biceps och triceps fick fler set och löpningen gick ner till en gång i veckan. Gamla pass behåller sina namn i historiken (Under-passen före 12 november heter fortfarande Under).

### Garmin

Sömn, HRV, vilopuls, steg och löprundor från Garmin-klockan visas i appen: ett kort för dagen överst i **Pass**, och löpning, sömn och återhämtning överst i **Framsteg**. Under **Vanor** bockas sömnen av när klockan mätt 10 timmar, och löpdagens pass när en löprunda finns.

**Löppasset på klockan:** tisdagens runda läggs som planerat pass i intervals.icu (uppvärmning, pratfart i pulszon 2, nedvarvning), och intervals.icu skickar det till Garmin. Pass som ligger kvar på dagar som inte längre är löpdagar tas bort. Det kräver att *upload workouts* är ibockat i Garmin-rutan på intervals.icu och att pulszonerna för löpning är ifyllda. Gympassen går inte att skicka – intervals.icu kan inte göra styrkepass med övningar och reps än.

**Läggdags:** appen räknar sömnskulden de senaste sju nätterna mot tio timmar och säger när du ska släcka i kväll (uppvakningstiden ställs in under Framsteg).

Datan går klockan → Garmin Connect → [intervals.icu](https://intervals.icu) (gratis, officiellt kopplad till Garmin) → appen. Koppla under **Framsteg → Koppla din Garmin**: skapa ett gratis konto på intervals.icu, koppla Garmin Connect under Settings med wellness ibockat och klistra in API-nyckeln från Settings → Developer Settings. Appen hämtar direkt från intervals.icu varje gång den öppnas. Nyckeln och värdena sparas bara på telefonen och följer inte med i backupen.

**Live puls:** pulsen från klockan visas live i en liten bubbla som ligger ovanpå appen och går att dra vart man vill (den fastnar vid närmaste kant och kommer ihåg platsen). Klockan kör gratisappen [HypeRate](https://apps.garmin.com/apps/31741843-431a-4aee-8f2f-b04775de7551) (Connect IQ), som skickar pulsen via Garmin Connect på telefonen till HypeRate. Bubblan visar en beskuren bit av HypeRates enkla pulsruta (hjärtat och siffran) – deras animerade hjärtan är videor som iPhone ritar med vit bakgrund. Slå på med **♥ Live puls** i Garmin-rutan under Pass eller på Boxning, och skriv in koden som klockan visar (det som står efter `app.hyperate.io/`). Bubblan stängs med × eller av sig själv efter fyra timmar. Garmin Connect måste vara igång på telefonen och telefonen behöver nät. Koden sparas bara på telefonen.

### Gardinen (SwitchBot)

Under Garmin-rutan i **Pass** finns raden **Gardinen** med knapparna **Stäng** och **Öppna**, som styr SwitchBot-gardinen direkt. SwitchBots moln-API släpper inte in webbappar (inget CORS), så anropen går via en liten gratis Cloudflare Worker som Filip lägger upp själv – koden finns i [`gymschema-worker.js`](gymschema-worker.js) och kopieras från appen (samma worker sköter påminnelserna). Workern skickar bara vidare till `api.switch-bot.com`, bara från appens adress och bara till enheterna och deras kommandon. Token och secret hämtas i SwitchBot-appen (Profile → Preferences → tryck 10 gånger på App Version → Developer Options), sparas bara på telefonen och signerar varje anrop med HMAC-SHA256. Kräver en SwitchBot Hub och att Cloud Services är på för gardinen. Under **⋯** på raden visas batteri, läge och om SwitchBot når gardinen. Når den inte fram är det oftast hubben som saknar ström eller wifi – SwitchBot svarar då ofta "device offline" (161) och inte "hub offline" (171).

### Påminnelser i mobilen

Notiser när det är läggdags (30 minuter innan och när det är dags – tiden räknas från sömnskulden), gymdag, löpdag, shake och hållning, även när appen är stängd. Slås på under **Vanor → Påminnelser i mobilen**; tider och vilka som ska komma ställs in där. Det är web push, som på iPhone kräver att GymSchema är öppnad från hemskärmen (iOS 16.4 eller senare).

Notiserna skickas av samma Cloudflare Worker som gardinen ([`gymschema-worker.js`](gymschema-worker.js)). Appen räknar ut notiserna för sju dagar framåt och skickar listan dit varje gång den öppnas och något ändrats; workern sparar den i KV (bindningen `GS`) och en Cron Trigger som körs varje minut skickar det som är dags. Notiserna krypteras enligt RFC 8291 (aes128gcm) och signeras med VAPID (RFC 8292) – nyckelparet skapas av workern första gången och ligger i KV. Workern sparar bara notisschemat och telefonens notisadress, och tar bara emot ändringar med appens nyckel eller från samma notisadress. Ett tryck på en notis öppnar rätt flik i appen.

### Coachen, prognos och lätt vecka

- **Coachen** överst i Framsteg kopierar de senaste fyra veckorna – pass, vikt, sömn, HRV, löpning och vanor – och öppnar Claude med en färdig fråga.
- **Prognos** räknar en rak linje genom de senaste åtta veckorna och säger när du når nästa vikt i varje övning, och när kroppsvikten når 70 och 80 kg.
- **Lätt vecka** föreslås när två av huvudövningarna (chins, bänkpress, benpress, hip thrust) stått still i tre pass, eller när Garmin visar att du är sliten. Tar du den blir det två set per övning och ungefär 10 % lättare den veckan, och lätta pass räknas inte som "förra gången" efteråt.

### Kropp: vikt och mat

Fliken **Kropp** (förut Vikt) har delarna **Vikt** och **Mat**. Under Mat räknas dagens kalorier och protein: shaken med glas (storlek och antal glas går att ställa in), och maten genom att skanna streckkoden på förpackningen – värdena hämtas från [Open Food Facts](https://world.openfoodfacts.org), en öppen och gratis matdatabas – eller skriva in den själv. Det du ätit ofta blir snabbval. Under Vanor bockas *125 g protein* och *Shaken* av av sig själva när siffrorna når målet. Streckkodsläsaren är ZXing (`vendor/zxing.min.js`, Apache-licens i `vendor/zxing-LICENSE.txt`).

**Kalorimålet** räknas varje dag: grunden är vikten från Vikt, 183 cm och 20 år (Mifflin–St Jeor) gånger 1,4 för vardagen plus 300 kcal för ca +1 kg i månaden. Till det läggs det klockan säger att du bränt på dagens pass (kcal från intervals.icu minus vilan under passet). När du vägt dig minst fyra gånger på två veckor jämförs vikten med +1 kg i månaden och målet flyttas upp eller ner (högst −300/+500 kcal).

**Vad ska jag äta?** räknar med hela shaken (2 700 kcal som standard) och föreslår mat för resten av dagen utifrån vad klockan är. **Recepten** är 26 egna: frukost, middag och matlåda, mellanmål – utan socker, honung, rapsolja, avokado, jordnötter och pumpafrön. Näringen per portion är uträknad från gram per ingrediens (`recipes.py` i byggskripten), portionerna går att skala, ingredienserna kan kopieras som inköpslista till Handla i Dagsschema och en portion läggs till i dagens mat med en tryckning.

### Löpväder

På löpdagen (tisdag) visar Pass bästa timmen att springa i Umeå (07–21): temperatur och känns som, timme för timme, vad du ska ha på dig, risk för halka (underkylt regn, regn och plusgrader följt av minus, nysnö, runt nollan), blåst och mörker. Vädret kommer från [Open-Meteo](https://open-meteo.com) (gratis, CC BY 4.0) och hämtas högst var 30:e minut. Kortet försvinner när dagens löprunda kommit från klockan.

### Prime-nivåer

Överst i Vanor: XP för det som tar dig mot Prime self – gympass 100, löprunda 50 + 10 per km (max 200), boxning 50, kameratränaren 20, varje vana 10, perfekt dag +50 och 10 h sömn enligt klockan +20. 15 nivåer från Start till Prime self (sedan ★2, ★3 …), streaks för perfekta dagar, socker, alkohol, sömn och gymveckor, och en XP-rad efter sparat pass. Allt räknas ur det som redan loggas; dagar äldre än 14 dagar sparas i en liggare (följer med i backupen) så att XP inte försvinner när Garmin-datan rullar ut.

### Bilder och hållning

- **Bilder** (under Kropp): progressbilder framifrån, från sidan och bakifrån. Kameran räknar ner tio sekunder och visar förra bilden genomskinlig så att du ställer dig likadant. Före och nu sida vid sida, med vikten de dagarna, och alla bilder som film. Bilderna sparas bara på telefonen (IndexedDB) och följer inte med i backupen.
- **Hållning** (under Kropp): AI:n [MediaPipe Pose](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) körs i telefonen och hittar öra, axel, höft, knä och fotled. Från sidan mäts hur långt örat sitter framför axeln och axeln framför höften (i cm, utifrån din längd), framifrån om axlar, höfter och huvud står snett. Mätningarna sparas och visas som trend. Det är en mätning med kameran, ingen diagnos. Bibliotek och modell hämtas första gången från jsDelivr och Google.

### Kameran som tränare

Under **Boxning**: AI:n (samma MediaPipe Pose, den lätta modellen) följer dig live genom kameran. *Armhävningar* och *Knäböj* räknas högt och appen säger till om du inte går tillräckligt djupt eller om höften sjunker. *Garden* säger "Händerna upp!" när händerna åker ner när du skuggboxas och räknar hur stor del av tiden garden var uppe. Veckans siffror står på kortet och följer med i backupen.

### Månadens sammanfattning

Sist i Framsteg: en bild i storyformat med månadens pass, set, ton, rekord, de övningar som gått mest framåt, vikt, löpning, sömn, perfekta dagar och boxning – att spara eller skicka.

## Dagsschema

Dagens lista som app: https://filipkymmer79-pixel.github.io/GymSchema/dag/ – öppna i Safari och välj *Dela → Lägg till på hemskärmen*. Listan skrivs i appen och sparas bara på telefonen.

### Listans format

En sak per rad. `# Rubrik` delar upp listan, och rubriken `Bra att ha` (eller `Utan ordning`) ger en del utan ordning. `- delsak` under en rad blir en egen ruta under den. `> text` blir en anteckning under raden. `[x] ` först på en rad betyder att den redan är gjord. Listor som kopieras direkt från en chatt (punktlistor, numrerade listor, fet rubrik) läses också.

Knappen **Ordna med Claude** kopierar listan tillsammans med en färdig fråga och öppnar Claude. Svaret klistras in i appen och blir dagens schema.

### Guld och vintage

Viktiga rader lyser guld: skriv `> Viktigt` på raden under (allt med *viktig* eller *måste* räknas, till exempel `> Ett måste i dag` eller `> Otroligt viktigt`). Anteckningen blir en guldbricka, raden glöder, och de viktiga samlas överst under **Viktigast i dag** – ett tryck där hoppar till raden. När något bockas av gnistrar det i guld, en del av dagen som är klar blir guld, och när allt är klart regnar det guld. Med *minska rörelse* påslaget i telefonen står glöden still och gnistorna stängs av.

Appen är i vintage-stil: svart och guld, Playfair Display, Lora och Courier Prime (Google Fonts) och lite filmkorn. **Vintage: på/av** längst ner byter till den första looken, och valet sparas på telefonen.

### Handla

Fliken **Handla** är en egen lista för inköp, med samma format. Varor läggs till med en rad i taget eller klistras in, **Sortera med Claude** delar upp dem efter var de står i butiken, och **Rensa avbockade** tar bort det som redan är köpt.

## Shake

Dagens shake som app: https://filipkymmer79-pixel.github.io/GymSchema/shake/ – öppna i Safari och välj *Dela → Lägg till på hemskärmen*.

- **Idag** visar receptet i lager i kannan och allt som ska tas fram. Tryck *Slut* på det som saknas, så räknas resten om. **Börja mixa** går igenom omgångarna steg för steg med timers, och efteråt bockas glasen av ett i taget.
- **Recept** ställer in storlek (2 000, 2 500 eller 3 000 kcal), tjocklek, honung, mjölkpulver, mjölksort, mixerkannans storlek och mått eller gram.
- **Näring** visar näringsvärdet och hur stor del av dagsbehovet som shaken och tillskotten täcker.
- **Handla** räknar ut vad som går åt för 1–14 dagar. **Kopiera listan** ger en lista som går att klistra in under Handla i Dagsschema.

Allt sparas bara på telefonen. Näringsvärdena är standardvärden per 100 g (Livsmedelsverket och USDA), och dagsbehoven kommer från de nordiska näringsrekommendationerna 2023. Vasslen är Star Nutrition Whey-80 Naturell och mäts i dl (37 g per dl enligt påsen): 1½ dl i 3 000, 1 dl i 2 500 och 2 000. Typsnittet är Sofia Sans, under SIL Open Font License (`shake/fonts/LICENSE.txt`).
