# GymSchema

Filips gymschema – program 2.0. Öppna https://filipkymmer79-pixel.github.io/GymSchema/ i Safari på mobilen och välj *Dela → Lägg till på hemskärmen*.

### Garmin

Sömn, HRV, vilopuls, steg och löprundor från Garmin-klockan visas i appen: ett kort för dagen överst i **Pass**, och löpning, sömn och återhämtning överst i **Framsteg**. Under **Vanor** bockas sömnen av när klockan mätt 10 timmar, och löpdagens pass när en löprunda finns.

**Löppassen på klockan:** måndag och torsdag läggs som planerade pass i intervals.icu (uppvärmning, pratfart i pulszon 2, nedvarvning), och intervals.icu skickar dem till Garmin. Det kräver att *upload workouts* är ibockat i Garmin-rutan på intervals.icu och att pulszonerna för löpning är ifyllda. Gympassen går inte att skicka – intervals.icu kan inte göra styrkepass med övningar och reps än.

**Läggdags:** appen räknar sömnskulden de senaste sju nätterna mot tio timmar och säger när du ska släcka i kväll (uppvakningstiden ställs in under Framsteg).

Datan går klockan → Garmin Connect → [intervals.icu](https://intervals.icu) (gratis, officiellt kopplad till Garmin) → appen. Koppla under **Framsteg → Koppla din Garmin**: skapa ett gratis konto på intervals.icu, koppla Garmin Connect under Settings med wellness ibockat och klistra in API-nyckeln från Settings → Developer Settings. Appen hämtar direkt från intervals.icu varje gång den öppnas. Nyckeln och värdena sparas bara på telefonen och följer inte med i backupen.

**Live puls:** pulsen från klockan visas live i en liten bubbla som ligger ovanpå appen och går att dra vart man vill (den fastnar vid närmaste kant och kommer ihåg platsen). Klockan kör gratisappen [HypeRate](https://apps.garmin.com/apps/31741843-431a-4aee-8f2f-b04775de7551) (Connect IQ), som skickar pulsen via Garmin Connect på telefonen till HypeRate. Bubblan visar en beskuren bit av HypeRates enkla pulsruta (hjärtat och siffran) – deras animerade hjärtan är videor som iPhone ritar med vit bakgrund. Slå på med **♥ Live puls** i Garmin-rutan under Pass eller på Boxning, och skriv in koden som klockan visar (det som står efter `app.hyperate.io/`). Bubblan stängs med × eller av sig själv efter fyra timmar. Garmin Connect måste vara igång på telefonen och telefonen behöver nät. Koden sparas bara på telefonen.

### Hemmet

Under Garmin-rutan i **Pass** finns knappar till hemmet, från början **Stäng gardinen**. En knapp kör genvägen med samma namn i iPhones app Genvägar (`shortcuts://run-shortcut?name=…`), och genvägen är en Siri-genväg som SwitchBot-appen gör (gardinen → ⚙ → Third-party Service → Siri Shortcuts; kräver SwitchBot Hub). SwitchBots moln-API går inte att anropa direkt från en webbapp (inget CORS). Webbappar får inte styra hemmet direkt, så iPhone hoppar in i Genvägar en kort stund. Första gången visar appen hur man gör genvägen. Fler knappar (t.ex. Öppna gardinen, Filmkväll) läggs till under ⋯.

### Coachen, prognos och lätt vecka

- **Coachen** överst i Framsteg kopierar de senaste fyra veckorna – pass, vikt, sömn, HRV, löpning och vanor – och öppnar Claude med en färdig fråga.
- **Prognos** räknar en rak linje genom de senaste åtta veckorna och säger när du når nästa vikt i varje övning, och när kroppsvikten når 70 och 80 kg.
- **Lätt vecka** föreslås när två av huvudövningarna (chins, bänkpress, benpress, hip thrust) stått still i tre pass, eller när Garmin visar att du är sliten. Tar du den blir det två set per övning och ungefär 10 % lättare den veckan, och lätta pass räknas inte som "förra gången" efteråt.

### Kropp: vikt och mat

Fliken **Kropp** (förut Vikt) har delarna **Vikt** och **Mat**. Under Mat räknas dagens kalorier och protein: shaken med glas (storlek och antal glas går att ställa in), och maten genom att skanna streckkoden på förpackningen – värdena hämtas från [Open Food Facts](https://world.openfoodfacts.org), en öppen och gratis matdatabas – eller skriva in den själv. Det du ätit ofta blir snabbval. Under Vanor bockas *125 g protein* och *Shaken* av av sig själva när siffrorna når målet. Streckkodsläsaren är ZXing (`vendor/zxing.min.js`, Apache-licens i `vendor/zxing-LICENSE.txt`).

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

### Handla

Fliken **Handla** är en egen lista för inköp, med samma format. Varor läggs till med en rad i taget eller klistras in, **Sortera med Claude** delar upp dem efter var de står i butiken, och **Rensa avbockade** tar bort det som redan är köpt.

## Shake

Dagens shake som app: https://filipkymmer79-pixel.github.io/GymSchema/shake/ – öppna i Safari och välj *Dela → Lägg till på hemskärmen*.

- **Idag** visar receptet i lager i kannan och allt som ska tas fram. Tryck *Slut* på det som saknas, så räknas resten om. **Börja mixa** går igenom omgångarna steg för steg med timers, och efteråt bockas glasen av ett i taget.
- **Recept** ställer in storlek (2 000, 2 500 eller 3 000 kcal), tjocklek, honung, mjölkpulver, mjölksort, mixerkannans storlek och mått eller gram.
- **Näring** visar näringsvärdet och hur stor del av dagsbehovet som shaken och tillskotten täcker.
- **Handla** räknar ut vad som går åt för 1–14 dagar. **Kopiera listan** ger en lista som går att klistra in under Handla i Dagsschema.

Allt sparas bara på telefonen. Näringsvärdena är standardvärden per 100 g (Livsmedelsverket och USDA), och dagsbehoven kommer från de nordiska näringsrekommendationerna 2023. Typsnittet är Sofia Sans, under SIL Open Font License (`shake/fonts/LICENSE.txt`).
