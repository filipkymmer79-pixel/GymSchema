# GymSchema

Filips gymschema – program 2.1. Öppna https://filipkymmer79-pixel.github.io/GymSchema/ i Safari på mobilen och välj *Dela → Lägg till på hemskärmen*.

**?** högst upp öppnar en guide över allt appen kan – 54 saker sorterade efter flik, med sökning (även utan å, ä och ö). *Visa var* hoppar till rätt flik, öppnar kortet om det behövs och lyser upp stället. Det som bara syns ibland (löpvädret på tisdagar, Flytta passet) säger när det syns.

### Utseendet

16 november 2026 fick appen designen *Bento*: rutor i olika storlek, som widgetarna på telefonens hemskärm. Filip valde den bland förslagen, och den ersatte *Ringen* från dagen innan (alltid svart, en ring per flik). Inga funktioner ändrades – samma flikar, knappar och texter.

- **Alltid ljust.** Ljusgrå botten, vita rutor med stora runda hörn och svart text, oavsett om telefonen står i ljust eller mörkt läge. Det som är klart blir svart.
- **En stor ruta högst upp på varje flik.** Överst står datum och vecka. Sedan kommer en stor färgad ruta med flikens rubrik, och under den små rutor med siffrorna:
  - *Pass*: dagens pass i passets färg, hur många set som är klara med en stapel, och en rund knapp som öppnar *Kör passet*. Under: *Klart* (svart), *Näst på tur* (nästa set med vikten), *Atlet i dag* (ett streck per block) och *Hållningen*. Passets minuter står i den stora rutan. En vilodag är rutan lila och en löpdag orange – då visar den Atlet i dag, och knappen rullar ner till blocken. När passet är sparat står volym och rekord i rutorna.
  - *Vanor*: dagens bockar, perfekta dagar i rad och veckan.
  - *Boxning*: antalet ronder och tiden, med startknappen i rutan.
  - *Framsteg*: veckans gympass, vanor och mat. Veckokollen under visar bara det rutorna inte säger.
  - *Kropp*: vikten mot målet, eller dagens kalorier, protein och det som är loggat.
  - *Historik*: de senaste åtta veckorna som staplar – fyra pass ger en full stapel – och passen som en lista.
  - *Program*: passets delar som en stapel där varje del är så lång som den tar. Raderna under hoppar till delen.
- **Dagens färg** kommer från passets skiva: röd, blå, gul eller grön en gymdag, orange en löpdag och lila en vilodag – alltid med svart text på. Den går igen i den stora rutan, knappen *Kör passet*, de klara seten och vilan.
- **Veckan** är en egen ruta på Pass: klara dagar är svarta med en bock, i dag har dagens färg och en missad dag är streckad.
- **Flikraden** är vit och svävar längst ner, med bara ikoner. Fliken du står på är en svart cirkel. Namnen finns kvar för skärmläsaren.
- **Listor i stället för kort i kort**: Atlet i dag, vanorna och historiken är var sin vit lista, och bockarna är runda och blir svarta.
- **Det som pågår är stora rutor**: vilan i *Kör passet* är en stor siffra i en ruta i passets färg, med en stapel som töms. Boxningsronden är en ruta som är röd när du kör, blå när du vilar och grön när det är klart.
- **Ett typsnitt**, Manrope: tjockt och tätt för rubriker och siffror, lugnt för text. Inga versaler. Typsnittet är inbäddat i själva sidan, så det finns i samma stund som appen öppnas – ingenting hämtas från Google Fonts. De ovanliga tecknen ligger i `vendor/manrope-latin-ext.woff2`. Archivo finns kvar för teckningarna och bilderna man delar, och Big Shoulders Display för de delade bilderna.
- **Ikoner i stället för emoji** i knappar, rubriker och rader ([Phosphor Icons](https://github.com/phosphor-icons/phosphor-core), MIT-licens). Texten är orörd: tecknet står kvar i texten, så sökning, kopiering och uppläsning fungerar som förut, men det visas som en linjeikon i textens färg. Maträtternas bilder i recepten och veckomenyn är kvar som de var.
- **Klockan högst upp** (telefonens statusrad) är ljusgrå med mörk text. Lades appen till på hemskärmen medan den var svart kan iPhone fortsätta rita appen under klockan med vit text – då ligger ett mörkt band bakom klockan så att den syns.
- Så är det byggt: ett lager sist i stilmallen gör om färger och former, och ett skript ritar datum och rutor efter varje omritning. Skriptet läser samma data som resten av appen och ändrar ingen logik.
- Licenser: `vendor/manrope-OFL.txt`, `vendor/archivo-OFL.txt` och `vendor/bigshoulders-OFL.txt` (SIL Open Font License), `vendor/phosphor-LICENSE.txt` (MIT).
- Kontrollerat i Chromium på 320, 390 och 430 px, alla flikar och blad, med telefonen i både ljust och mörkt läge. Inte provat på en riktig iPhone.

### Nya versioner kommer av sig själva

En iPhone tar ofta fram appen ur minnet utan att ladda om den, och då syns inte en ny version förrän appen stängts helt. Sedan 15 november 2026 frågar appen därför efter `version.json` varje gång den tas fram. Finns en nyare version laddar den om sig själv och visar *Uppdaterad ✓* – men bara just när appen tas fram och inget pågår: inte medan vilotimern går, ett blad eller en guide är öppen, boxningen är i gång eller man skriver. Det sker högst en gång per version, så det kan inte bli en slinga, och bockade set ligger kvar efteråt. Första gången behöver appen stängas helt en gång (svep bort den i appväxlaren) för att den här funktionen ska komma in.

### Programmet

Överkroppen först, benen korta och tunga. **Över** onsdag och lördag (chins, hantelbänkpress, kabelrodd, axelpress, sidolyft, hantelshrugs, bicepscurl, hammarcurl, face pulls). **Ben + över** torsdag och söndag: benpress, vadpress (i benpressen direkt efter), rumänska marklyft och höftabduktion i maskin, sedan lutande hantelpress, sidolyft och tricepspress med rep i kabel, sist plankan och dead bug. Tricepspressen (neråt, armbågarna mot sidorna) ersatte triceps över huvudet 15 november 2026; gamla pass behåller sitt namn i historiken, och ett pågående pass eller eget upplägg följer med. Hållningspasset (varje dag, ca 20 min) fick 16 november kort fot för höger fot, 90/90 med ballong och höftskift åt vänster, före fascia-hållet. Samma dag fick det en egen ruta på Pass, varje dag: knappen kör alla övningarna i ordning i guiden, med teckningen för varje övning och timer där det är ett håll (dörrkarmen 2 × 30 s per sida, dead hang 2 × 20 s, fascia-hållet 2 min per sida). När guiden är klar bockas *Hållning + fascia* av under **Vanor**, och rutan blir svart. Samma knapp finns i blocket Hållningen i Atlet i dag och överst i Program → Hållning. 15 november flyttades all biceps till Över-dagarna (bicepscurl + hammarcurl, 12 set i veckan som förut men aldrig två dagar i rad) och **höftabduktion i maskin** (3 × 15–20) ersatte hip thrust. Set som redan bockats av i ett pågående pass sparas ändå, ett eget upplägg flyttas med, och en äldre backup flyttas när den läses in. Över tar ca 67 minuter och Ben + över ca 60 (bara övningarna). Tisdagen är löpdag: lugn jogg till en backe, Starka ben, backhopp och sprint, och lugn jogg hem (se *Atletprogrammet* nedan). Måndag och fredag är vilodagar från gymmet. Upphoppen i uppvärmningen före benen togs bort 14 november 2026 – spänsten i Atletprogrammet ersätter dem. I rutan *Veckan* på Pass syns hela veckan, måndag till söndag: gympassen (Ö1, B1, Ö2, B2), *Löp* på tisdagen och *Vila* på måndag och fredag. Gympassen bockas när de sparas, vilodagen när hållningen är avbockad under **Vanor** och tisdagen när löprundan finns (från klockan eller avbockad under Vanor). Varje övning har bild, steg för steg, vanliga fel och video under **Program**.

Version 2.1 kom 12 november 2026: dagarna flyttades en dag, lårcurl utgick, biceps och triceps fick fler set och löpningen gick ner till en gång i veckan. Gamla pass behåller sina namn i historiken (Under-passen före 12 november heter fortfarande Under). Samma kväll kom hantelshrugs in på Över-dagarna, 2 × 10–12 efter sidolyften, för trapezius (musklerna mellan nacken och axlarna). 14 november byttes sidolyft i maskin mot **sidolyft i kabel, en arm i taget** (låg trissa, ett handtag) på båda passen – gymmet har ingen sidolyftsmaskin. Den loggas per arm som bicepscurlen (höger först), 3 × 12–20: plattorna väger 5 kg, så man bygger reps länge innan nästa platta. Gamla pass med sidolyft i maskin ligger kvar i historiken.

**✏️ Ändra programmet själv** (Program → *Ändra övningar, set och reps*, eller länken överst i passet): set (1–6), reps och vila för varje övning, ordningen med ↑ ↓, byt en övning för alltid (samma alternativ som *Upptagen?*, med egna reps), pausa en övning eller lägg till en från det andra passet. Ändringarna gäller båda passen med samma övningar, sparas direkt på telefonen och följer med i backupen. Passet i Pass-fliken ändras direkt: set du redan gjort ligger kvar, och en övning du redan kört i dag byts eller pausas först nästa pass. Program-fliken visar ditt upplägg i din ordning, supersetparen följer ordningen och passets tid räknas om. *Återställ* tar tillbaka originalet.

**↪ Flytta passet**: blir ett pass inte av kommer en banner dagen efter. Välj ny dag så skjuts det som låg där till nästa lediga dag, så att det ändå blir fyra pass i veckan. Dagens pass går också att flytta innan det börjat (*↪ Flytta* överst i passet), eller hoppa över den veckan. Veckoremsan, dagens pass, Vanor, veckokollen och gympåminnelserna följer flytten. Nästa vecka är som vanligt igen.

### Atletprogrammet

Sedan 14 november 2026 ligger Atletprogrammet runt gympassen: 110 övningar i 17 grupper – fötter och balans, kvällsvila, spänst, starka ben, backe och sprint, isometriskt, slåss, Shaolin, yoga, rörlighet, kalistenik, Dirty thirty och surf på land.

16 november kom nya övningar från Filips klipp: tålyft mot vägg i Fötter och balans (varje dag), Dirty thirty på måndagar (sit-ups, benlyft, tåtouch, cykelcrunch, kick-outs och sit-up till tårna, 30 av varje), kick-through 360 i Kalistenik, växelhopp och dropphopp i Spänst A, djuphopp och stegupphopp i Spänst B, Kvällsvila med benen upp mot väggen sist varje dag, och Backflip i 19 steg under Backflip (på klubb med tränare). Övningar i klippen som redan fanns – katten, framåtfällningarna, hjulning, handstående, 90/90, split, sidohopp över häck och sittande hopp – fick inga dubbletter.

- **Atlet idag** (kortet överst i **Pass**) visar dagens block i rätt ordning runt passet, med minuter, plats, anteckningar, klipp och en bock per övning. Måndag: Fötter, Yoga, Kalistenik, Dirty thirty. Tisdag: Fötter, Spring lugnt till en backe, Starka ben, Backe och sprint, Spring lugnt hem. Onsdag och lördag: Isometriskt och Slåss efter Över, Fötter på kvällen. Torsdag: Spänst B före Ben + över. Fredag: Fötter, Shaolin, Rörlighet, Surf på land. Söndag: Spänst A före Ben + över. Hållningen står först och Kvällsvila sist varje dag; hållningen är samma bock som under Vanor. Flyttas ett gympass följer blocken med.
- **Joggen är löprundan**: tisdagens två joggblock bockas av sig själva när klockan loggat en runda, och är båda bockade räknas dagens träning som klar under Vanor.
- **Slåss** har en knapp som startar Boxning med 3 ronder à 3 min och 1 min vila. Rondens namn står på skärmen, och varje hel rond bockar Rond 1–3 i blocket. De egna inställningarna under Boxning ändras inte.
- **Program → Atlet** har fyra delar. *Veckan*: alla sju dagarna, och varje dags block. *Övningar*: alla 17 grupper med klipp, namn, dos, tagg, tips och källa – och teckningen av pop-upen. *Mål*: hopptestet, vad man kan räkna med, målen, backflip steg för steg och surf. *Grundtips*: se nedan.
- **Grundtips** (14 november 2026): 168 grundtips i 19 delar – det som gäller allt, gympassen, fötter och balans, kvällsvila, spänst, hopptestet, joggen, starka ben, backe och sprint, isometriskt, slåss, Shaolin, yoga, rörlighet, kalistenik, Dirty thirty, surf, backflip och styrka med stång. Varje tips är en regel, hur man gör och varför, ibland med ett snabbtest (*Testa:*), en källa och en knapp till klippet som visar det. Fjorton tips har en teckning med rätt och fel sida vid sida (fotens tre punkter, knät över foten, armsvingen, höften i nedgången, sprintstarten, löpsteget, höftlyftet, fotställningen i boxning, hästställningen, framåtfällningen, handståendet och planchen – och pop-upen).
  - **Dagens fokus** står i varje öppet block i *Atlet idag*: ett tips i taget. Varje gång blocket står på schemat kommer nästa tips, de viktigaste först. *Den sitter* bockar av ett tips så att det hoppas över (det går att ångra i listan). Gympassen och joggen har sitt fokus på en rad, testdagar har ett testtips under raden *Testdag*, och under blocken står *Veckans grundregel*, som byts varje måndag.
  - **Program → Atlet → Grundtips** har alla tips, del för del, med en räknare för hur många som sitter. Samma listor öppnas från *Alla tips →* i fokusrutan, från varje grupp under Övningar, från hopptestet och från Backflip och Surf under Mål. I klippvisaren står tipset som hör till klippet.
  - Bygget kontrollerar tipsen mot programmet: varje block och varje grupp har tips, och varje klippknapp pekar på en övning som finns. Texterna är dessutom genomlästa mot programmets egna (halva antalet set vecka 1–2, vikter först från vecka 4, fråga Tobias vid ont i en led) och mot gympassens regler i appen. Källorna står under tipsen och i listan längre ner.
- **Hopptest** (Framsteg, och Program → Atlet → Mål): upphopp och längdhopp i cm varannan söndag, med graf och skillnad mot förra testet. Söndagens kort och gymnotis säger när det är testdag.
- **Klippen ligger inte i repot.** De är andras videor. Knappen **Importera klipp** (Program → Atlet, och i kortet när klippen saknas) läser `Atletklipp.zip` och `Atletklipp-2.zip` (de nya övningarna från 16 november) från Filer – båda kan väljas på en gång – packar upp dem i telefonen och sparar de 109 klippen och bilderna i IndexedDB. Rutan säger vilken fil som saknas. Sedan spelas de i appen, loopar, går i halv fart och fungerar utan nät. Har telefonen rensat datan visas knappen igen. Uppackaren är JSZip 3.10.1 (`vendor/jszip.min.js`, används under MIT-licensen – texten ligger i `vendor/jszip-LICENSE.txt`) och ligger i appens offline-cache.
- Bockarna, testerna, startdagen och vilka grundtips som sitter sparas på telefonen (`gymschema.atlet.v1`) och följer med i backupen. Klippen följer inte med i backupen.

**Källor till grundtipsen** (de som står med *Källa:* under ett tips, och det övriga underlaget):

- Spänst: [NSCA:s riktlinjer för plyometrisk träning](https://open-exam-prep.com/study-guides/cscs/exercise-technique/plyometric-speed-training) och [UKSCA](https://uksca.org.uk/blog/55/understanding-plyometrics-a-coachs-guide) (80–100 landningar för nybörjare, två–tre dygn mellan passen, kort tid i golvet). [Wulf m.fl. 2007](https://lida.sport-iat.de/ta/Record/4015755) (högre hopp med ett mål att nudda). [Lees m.fl. 2004](https://lida.sport-iat.de/twm/Record/4012686) och [Ashby & Heegaard 2002](https://bvbvf1.bib-bvb.de/vufind/PrimoRecord/cdi_proquest_miscellaneous_72710952) (armsvingen). [Landningsljud och stötkraft](https://brookbushinstitute.com/article/higher-vertical-ground-reaction-forces-associated-louder-landing-sound). [Tucker m.fl. 2015](https://search.pedro.org.au/search-results/record-detail/45237) (10–20 maxhopp med 30 sekunders vila, två gånger om dagen, och starkare höftben; studien gjordes på kvinnor 25–50 år) och Robling och Turner om varför vilan mellan stötarna spelar roll ([PubMed](https://pubmed.ncbi.nlm.nih.gov/11606612), [ScienceDaily](https://sciencedaily.com/releases/2004/10/041006082858.htm)).
- Sömn: [Mah m.fl., Stanford 2011](https://sciencedaily.com/releases/2011/07/110701083506.htm).
- Sprint: [vila en minut per tio meter](https://simplifaster.com/articles/speed-training-team-sports-mistakes/), [backsprint och acceleration](https://scienceforsport.com/do-hill-sprints-improve-acceleration/), [teknikpunkter](https://athleticlab.com/5-sprinting-cues-to-improve-your-acceleration-and-top-speed/). [Chaabene m.fl. 2019](https://www.frontiersin.org/article/10.3389/fphys.2019.01468/full) (stretch över en minut per muskel före kraft). [Faulkner m.fl. 2013](https://lida.sport-iat.de/ta/Record/4027751) (varma lår i vilan gav 9,6 % högre toppeffekt i en cykelsprint).
- Isometriskt och senor: [Oranchuk m.fl. 2019](https://openrepository.aut.ac.nz/items/1a37e689-0027-4a12-9815-07ff2818b768/full), [Mersmann m.fl. 2021](https://www.frontiersin.org/articles/10.3389/fphys.2021.626225/pdf).
- Fötter och balans: [foten som grund](https://informedinsport.squarespace.com/new-blog/2016/4/8/you-must-have-good-tyres-why-and-how-to-train-the-foot), [balansträning och stukningar hos fotbollsspelare](https://physio-network.com/research-reviews/ankle-foot/injury-prevention-programs-that-include-balance-training-exercises-reduce-ankle-injury-rates-among-soccer-players-a-systematic-review/).
- Rörlighet: [Thomas m.fl. 2018](https://lida.sport-iat.de/ta/Record/4047878) (minst fem dagar i veckan gav bäst resultat). *Spänn–slappna av*-stretch ströks: [Behm m.fl. 2023](https://link.springer.com/article/10.1186/s40798-023-00652-x) fann ingen skillnad mot vanlig stretch.
- Slåss: [ExpertBoxing](https://expertboxing.com/the-beginners-guide-to-boxing), [Filimonov m.fl. 1985](https://sas.blogs.lincoln.ac.uk/?p=1295) (armen står för en fjärdedel av slaget hos vana boxare), [rundsparken](https://turtlepress.com/training/common-roundhouse-kick-mistakes-and-how-to-avoid-them). Shaolin: [Shifu Yan Lei om hästställningen](https://shifuyanlei.co.uk/blogs/news/are-you-doing-it-right-horse-stance).
- Kalistenik: [GMB om handstående](https://gmb.io/handstand/) och [planche](https://gmb.io/planche/), [Antranik om kråkan](https://antranik.org/the-crow-pose/). Surf: Barefoot Surf om [pop-upen](https://barefootsurftravel.com/?p=7956) och [säkerhet](https://barefootsurftravel.com/?p=7844). Rörlighet i höften: [Precision Movement](https://precisionmovement.coach/hip-flexor-stretches-poor-form/).
- Det som gäller allt: [fördelad övning](https://us.humankinetics.com/blogs/excerpt/distribution-of-practice-in-motor-learning-and-development), [andning vid ansträngning](https://open-exam-prep.com/study-guides/nsca-cpt/coaching-instruction/movement-safety-biomechanics), [uppvärmning (RAMP)](https://scienceforsport.com/warm-ups/). Gympassens tips följer appens egna regler (1–2 reps kvar, toppen av spannet i alla set, *Nyckeln* under varje övning).

### Kör passet, snabbläge och upptagen maskin

- **▶ Kör passet – ett set i taget** (överst i passet) visar ett set åt gången: övningens bild, nyckeln och videolänken, vikt och reps med stora +/− (vikten från förslaget, repsen från förra gången i samma set) och en stor *Klart*-knapp. Sedan kommer vilan med stor nedräkning, +30 s och *Kör nu*, och nästa set med bild. Före första övningen kommer uppvärmningsseten med riktiga vikter (10 st på 50 % och 5 st på 75 % av arbetsvikten – på chinsen mer hjälp i stället), och i snabbläget ett lätt set för 2:an i första supersetet. Plankan har en hålltimer. Seten loggas precis som i listan, så timern, rösten, "slog förra gången" och supersets fungerar likadant. *Upptagen?* finns där också. Har du inte värmt upp börjar det med uppvärmningsrutinen (med timer och bilder), och sist kommer mage och stretch innan du sparar – hela passet guidat.
- **🎥 Formcheck** (knappen vid bilden i Kör passet, och under varje övning i Program): mobilen räknar ner 5 eller 10 sekunder så att du hinner ställa dig, filmar setet och spelar upp det i halv fart eller kvartsfart bredvid övningens bild, nyckeln och vanliga fel att kolla efter. Det senaste klippet för varje övning sparas bara på telefonen (samma lagring som progressbilderna, inte i backupen) och syns under övningen i Program.
- **▶ Videon i appen**: alla teknikvideor – i Kör passet, Program, uppvärmningen, mage, stretch och boxningen – spelas i en spelare i appen i stället för att YouTube öppnas (youtube-nocookie, stängs med × eller Escape). Går en video inte att spela i appen finns *öppna den i YouTube* under spelaren.
- **Passets tid** räknas från första setet till att passet sparas och syns efter passet och i historiken.
- **📤 Dela bild** efter sparat pass gör en bild (1080 × 1350) med passet, set, volym, tid, rekord och bästa setet i varje övning – för story, TikTok eller att skicka till någon.
- **⚡ Snabbläge – supersets** (brytare överst i passet) kör övningarna i par som inte tar från varandra: ett set av 1:an, direkt till 2:an (20 sekunder att byta), vila först efter båda. Över: chins + hantelbänkpress, kabelrodd + axelpress, sidolyft + bicepscurl, hammarcurl + face pulls (shrugs körs ensam). Ben + över: benpress + lutande hantelpress, vadpress + sidolyft, höftabduktion + triceps, plankan + dead bug (rumänska marklyft körs ensam). Timern och röstcoachen följer paren. Appen visar hur lång tid övningarna tar: ca 43 i stället för 61 minuter på Över och 41 i stället för 53 på Ben + över (uppvärmning och stretch inte medräknade). Valet sparas till nästa pass.
- **Upptagen? Byt** finns på varje maskinövning och ger tre sätt: kör något annat först (flyttar övningen – eller supersetet – sist i passet), fråga om du får köra in dig mellan setet, eller byt övning i dag till en med samma muskler (till exempel bröstpress i maskin i stället för hantelbänkpress, omvända flyes i pec deck-maskinen i stället för face pulls). Bytet loggas med eget namn och egen historik, så förslagen, rekorden och graferna för originalövningen påverkas inte, och nästa gång du tar samma byte står förra gångens vikt där. Bytet går bara att göra innan du loggat set i övningen.

### Garmin

Sömn, HRV, vilopuls, steg och löprundor från Garmin-klockan visas i appen: ett kort för dagen överst i **Pass**, och löpning, sömn och återhämtning överst i **Framsteg**. Under **Vanor** bockas sömnen av när klockan mätt 10 timmar, och löpdagens pass när en löprunda finns.

**Löppasset på klockan:** tisdagens pass läggs som planerat pass i intervals.icu – 12 min lugnt till backen i pulszon 2, backpasset (Starka ben + Backe och sprint, 33 min utan pulsgräns, tryck Lap när det är klart) och 12 min lugnt hem – och intervals.icu skickar det till Garmin. Pass som ligger kvar på dagar som inte längre är löpdagar tas bort. Det kräver att *upload workouts* är ibockat i Garmin-rutan på intervals.icu och att pulszonerna för löpning är ifyllda. Gympassen går inte att skicka – intervals.icu kan inte göra styrkepass med övningar och reps än.

**Läggdags:** appen räknar sömnskulden de senaste sju nätterna mot tio timmar och säger när du ska släcka i kväll (uppvakningstiden ställs in under Framsteg).

Datan går klockan → Garmin Connect → [intervals.icu](https://intervals.icu) (gratis, officiellt kopplad till Garmin) → appen. Koppla under **Framsteg → Koppla din Garmin**: skapa ett gratis konto på intervals.icu, koppla Garmin Connect under Settings med wellness ibockat och klistra in API-nyckeln från Settings → Developer Settings. Appen hämtar direkt från intervals.icu varje gång den öppnas. Nyckeln och värdena sparas bara på telefonen och följer inte med i backupen.

**Live puls:** pulsen från klockan visas live i en liten bubbla som ligger ovanpå appen och går att dra vart man vill (den fastnar vid närmaste kant och kommer ihåg platsen). Klockan kör gratisappen [HypeRate](https://apps.garmin.com/apps/31741843-431a-4aee-8f2f-b04775de7551) (Connect IQ), som skickar pulsen via Garmin Connect på telefonen till HypeRate. Bubblan visar en beskuren bit av HypeRates enkla pulsruta (hjärtat och siffran) – deras animerade hjärtan är videor som iPhone ritar med vit bakgrund. Slå på med **♥ Live puls** i Garmin-rutan under Pass eller på Boxning, och skriv in koden som klockan visar (det som står efter `app.hyperate.io/`). Bubblan stängs med × eller av sig själv efter fyra timmar. Garmin Connect måste vara igång på telefonen och telefonen behöver nät. Koden sparas bara på telefonen.

### Gardinen (SwitchBot)

Under Garmin-rutan i **Pass** finns raden **Gardinen** med knapparna **Stäng** och **Öppna**, som styr SwitchBot-gardinen direkt. SwitchBots moln-API släpper inte in webbappar (inget CORS), så anropen går via en liten gratis Cloudflare Worker som Filip lägger upp själv – koden finns i [`gymschema-worker.js`](gymschema-worker.js) och kopieras från appen (samma worker sköter påminnelserna). Workern skickar bara vidare till `api.switch-bot.com`, bara från appens adress och bara till enheterna och deras kommandon. Token och secret hämtas i SwitchBot-appen (Profile → Preferences → tryck 10 gånger på App Version → Developer Options), sparas bara på telefonen och signerar varje anrop med HMAC-SHA256. Kräver en SwitchBot Hub och att Cloud Services är på för gardinen. Under **⋯** på raden visas batteri, läge och om SwitchBot når gardinen. Når den inte fram är det oftast hubben som saknar ström eller wifi – SwitchBot svarar då ofta "device offline" (161) och inte "hub offline" (171).

### Påminnelser i mobilen

Notiser när det är läggdags (30 minuter innan och när det är dags – tiden räknas från sömnskulden), gymdag, löpdag, shake, hållning, middag, vägning, veckokoll, tillskott, måltidsrytm och kroppsmått, även när appen är stängd. Shaken kommer som en påminnelse per glas – första på tiden du väljer, sedan var fjärde timme (senast 20.00) – och glas som redan är bockade under Mat hoppas över. Veckokollen kommer söndag kväll. Vägningen kommer måndag och torsdag en kvart efter väckningstiden (om du inte redan vägt dig), eftersom kalorimålet behöver minst fyra vägningar på två veckor. Middagsnotisen säger vad du lagar i kväll enligt veckomenyn, och kvällen innan kommer en till om något ska förberedas (ärtorna i blöt till ärtsoppan, marinad över natten). Timers i laga-läget på mer än ett par minuter kommer också som notis, så de hörs när mobilen är låst. Gymdagens notis säger vad som ligger före och efter passet i Atletprogrammet (och när det är testdag), och hållningsnotisen vilka hemmablock som är kvar. Slås på under **Vanor → Påminnelser i mobilen**; tider och vilka som ska komma ställs in där. Det är web push, som på iPhone kräver att GymSchema är öppnad från hemskärmen (iOS 16.4 eller senare).

Notiserna skickas av samma Cloudflare Worker som gardinen ([`gymschema-worker.js`](gymschema-worker.js)). Appen räknar ut notiserna för sju dagar framåt och skickar listan dit varje gång den öppnas och något ändrats; workern sparar den i KV (bindningen `GS`) och en Cron Trigger som körs varje minut skickar det som är dags. Notiserna krypteras enligt RFC 8291 (aes128gcm) och signeras med VAPID (RFC 8292) – nyckelparet skapas av workern första gången och ligger i KV. Workern sparar bara notisschemat och telefonens notisadress, och tar bara emot ändringar med appens nyckel eller från samma notisadress. Ett tryck på en notis öppnar rätt flik i appen.

### Coachen, prognos och lätt vecka

- **Veckokoll** överst i Framsteg: gympassen (av fyra), rekord, vikten mot veckan innan, kalorier och protein om dagen (dagar med loggad mat), sömn från klockan och vanorna – plus det viktigaste att göra, bara ett råd: pass som är kvar, äta mer om vikten står still, protein, sömn eller "fortsätt exakt så här". Måndag och tisdag visas förra veckan. Helgen har en knapp för att planera nästa veckas middagar.
- **🎯 Mål** i Framsteg: sätt ett mål för en övning – till exempel chins utan hjälp × 5 eller bänkpress med 30 kg-hantlar × 6 (minsta antal reps går att välja; plankan i sekunder). Appen visar bästa hittills, en stapel från där du var när målet sattes, och när du är där i din egen takt (rak linje genom de senaste åtta veckorna). Målet syns också under övningen i passet med hur mycket som är kvar. När ett sparat pass når målet kommer konfetti och *Mål klart!*, och klara mål listas med datum.
- **Rekord** i Framsteg: bästa setet i varje övning med datum, uppskattat max för en rep (Epley) och nästa ökning när appen föreslår en, plus hur många veckor i rad du kört alla fyra passen. Lätta veckor och byten räknas inte. Ett tryck visar kurvan för övningen.
- **Coachen** överst i Framsteg kopierar de senaste fyra veckorna – pass, vikt, sömn, HRV, löpning, vanor, Atletprogrammet och hopptesten – och öppnar Claude med en färdig fråga.
- **Prognos** räknar en rak linje genom de senaste åtta veckorna och säger när du når nästa vikt i varje övning, och när kroppsvikten når 70 kg och viktmålet.
- **Lätt vecka** föreslås när två av huvudövningarna (chins, bänkpress, benpress, rumänska marklyft) stått still i tre pass, eller när Garmin visar att du är sliten. Tar du den blir det två set per övning och ungefär 10 % lättare den veckan, och lätta pass räknas inte som "förra gången" efteråt.

### Kropp: vikt och mat

Fliken **Kropp** (förut Vikt) har delarna **Vikt** och **Mat**. Under Mat räknas dagens kalorier och protein: shaken med glas (storlek och antal glas går att ställa in; proteinet följer shake-appens recept sedan 16 november – 100, 125, 133 och 146 g för 2 000, 2 500, 2 700 och 3 000 kcal), och maten genom att skanna streckkoden på förpackningen – värdena hämtas från [Open Food Facts](https://world.openfoodfacts.org), en öppen och gratis matdatabas – eller skriva in den själv. Det du ätit ofta blir snabbval. Under Vanor bockas *125 g protein* och *Shaken* av av sig själva när siffrorna når målet. Streckkodsläsaren är ZXing (`vendor/zxing.min.js`, Apache-licens i `vendor/zxing-LICENSE.txt`).

**⚖️ Viktmål med datum** (under Vikt): välj vikt och månad, till exempel 80 kg till juni. Appen räknar ut hur många kilo i månaden som behövs och säger om det är realistiskt: upp till +1 kg i månaden är mest muskler, upp till +1,5 går men ger mer fett, och snabbare än så är för fort – då föreslås ett realistiskt datum med +1 kg i månaden. Kalorimålet under Mat ställs in efter takten (högst +1,5 kg i månaden), planlinjen i viktgrafen går mot målet på datumet och målet syns bland målen i Framsteg.

**📏 Kroppsmått** (under Vikt): midja, bröst, arm och lår med måttband en morgon i månaden, med en bild som visar var du mäter. Appen jämför midjan med vikten sedan första mätningen: högst 1 cm midja per kilo är mest muskler, 1–1,5 är okej och mer än så betyder mer fett än muskler – då är rådet att äta ca 150 kcal mindre om dagen. Står vikten still men midjan krymper och armen växer är det muskler upp och fett ner. Fyra veckor efter förra mätningen kommer en påminnelse.

**Kalorimålet** räknas varje dag: grunden är vikten från Vikt, 183 cm och 20 år (Mifflin–St Jeor) gånger 1,4 för vardagen plus 300 kcal för ca +1 kg i månaden (eller den takt viktmålet behöver). Till det läggs det klockan säger att du bränt på dagens pass (kcal från intervals.icu minus vilan under passet). När du vägt dig minst fyra gånger på två veckor jämförs vikten med +1 kg i månaden och målet flyttas upp eller ner (högst −300/+500 kcal).

**Vad ska jag äta?** räknar med hela shaken (2 700 kcal som standard) och föreslår mat för resten av dagen utifrån vad klockan är. **Recepten** är 140 egna: 21 frukostar, 100 middagar och 19 mellanmål – utan socker, honung, rapsolja, avokado, jordnötter, pumpafrön och alkohol. I listan går det att söka (även utan å, ä och ö), filtrera på huvudråvara (kyckling, nöt & lamm, fläsk, fisk & skaldjur, vego) och på max 30 minuter, matlåda och går att frysa, och 🎲 Slumpa väljer en middag åt dig. Näringen per portion är uträknad från gram per ingrediens (`recipes.py` i byggskripten), portionerna går att skala, ingredienserna kan kopieras som inköpslista till Handla i Dagsschema och en portion läggs till i dagens mat med en tryckning.

**Veckomeny** (knapp under Vad ska jag äta? och i receptlistan) lägger upp veckans sju middagar: 2 kyckling, 2 nöt, 2 fisk och 1 fläsk – ibland vego i stället för en kyckling eller en nöt – och aldrig samma sorts kött två dagar i rad. Snabba rätter (högst 45 minuter) på gymdagarna onsdag och torsdag, fredagsmys (tacos, burgare, pizza, quesadillas …) på fredag, helgmat på lördag och på söndag en rätt som räcker till matlådor. Favoriterna kommer oftare och det du ätit de senaste tre veckorna mer sällan. 🎲 byter en dag (och försöker hålla veckans mix), 🔒 låser den så att den ligger kvar när du trycker *Ny meny*, och en dag kan sättas till *Ingen middag*. Portionerna ställs in med tre val: hur många som äter middag, matlådor från varje middag och extra matlådor från söndagens middag – lunch till veckan. Med tre eller fler söndagslådor väljs bara rätter som går att frysa eller håller 4–5 dagar. Det går att bläddra till nästa vecka (på söndagar öppnas nästa vecka direkt), och ett recept kan läggas på valfri dag med *Lägg i veckomenyn*. Dagens middag syns som *I kväll* överst under Mat och efter att du sparat passet.

**Inköpslistan** räknar ihop allt som behövs till de dagar du väljer (från i dag till söndag från början), med rätt mängd för portionerna, sorterat efter avdelning i butiken – frukt och grönt, bröd, kött och fisk, mejeri, skafferi, frys – med vilken dag och rätt varje vara är till. Salt, kryddor, olja, soja och sånt står under *Kolla att du har hemma*; tryck på det som är slut så kommer det med. Bocka av det du har eller lagt i korgen, och *Kopiera till Handla* ger en lista med rubriker som går att klistra in rakt av i Dagsschema. *Dela listan* skickar den som vanlig text, till exempel i ett sms. Varje ingrediens i recepten är kopplad till en vara i butiken i `shop.py` i byggskripten.

**Laga-läge** (👨‍🍳 *Laga nu* i receptet eller *Laga* på I kväll) går igenom receptet ett steg i taget med stor text: först *Plocka fram* med alla ingredienser att bocka av, sedan stegen. Tider i texten ("rosta i 35–40 minuter") blir timerknappar – flera kan gå samtidigt, ett tryck på timern hoppar till steget, och när den är klar piper och vibrerar mobilen och rösten säger till. Skärmen hålls tänd, steget kan läsas upp och allt ligger kvar om appen stängs. Sist kan du logga portionen och spara receptet som favorit (♥, finns även i receptet och som filter i listan). Receptet visar hur många gånger du lagat det.

**Matlådor**: det som blir över när du lagat i laga-läget (portionerna minus de som äter) hamnar under Mat med bäst-före efter receptet (till exempel två dagar för lax, fyra för grytor). *Ät en* loggar en portion med en tryckning, ❄️ flyttar den till frysen (ca tre månader) och en låda som gått ut blir röd.

**Vad har jag hemma?** – tryck på det du har i kylen, frysen och skafferiet så sorteras middagarna efter hur lite du behöver köpa, med vad som fattas under varje.

### Löpväder

På löpdagen (tisdag) visar Pass bästa timmen att springa i Umeå (07–21): temperatur och känns som, timme för timme, vad du ska ha på dig, risk för halka (underkylt regn, regn och plusgrader följt av minus, nysnö, runt nollan), blåst och mörker. Vädret kommer från [Open-Meteo](https://open-meteo.com) (gratis, CC BY 4.0) och hämtas högst var 30:e minut. Kortet försvinner när dagens löprunda kommit från klockan.

### Prime-nivåer

Överst i Vanor: XP för det som tar dig mot Prime self – gympass 100, löprunda 50 + 10 per km (max 200), boxning 50, atletblocken 2 per minut i blocket (efter hur mycket som är bockat), kameratränaren 20, varje vana 10, perfekt dag +50 och 10 h sömn enligt klockan +20. 15 nivåer från Start till Prime self (sedan ★2, ★3 …), streaks för perfekta dagar, socker, alkohol, sömn och gymveckor, och en XP-rad efter sparat pass. Allt räknas ur det som redan loggas; dagar äldre än 14 dagar sparas i en liggare (följer med i backupen) så att XP inte försvinner när Garmin-datan rullar ut.

### Vanor: tillskott, vatten och dagar i rad

- **💊 Tillskott** som checklista under vanan: kreatin, selen och Puori i shaken, D-pärlan till första glaset och magnesium på kvällen – var och en med tid. Bocka dem en och en, eller tryck på raden *Tillskott* så bockas alla. Vanan bockas av sig själv när alla är tagna. *Ändra tillskott och tider* lägger till, tar bort och flyttar. Påminnelsen kommer på tiden; det som ligger på shakens tid kommer med i shake-påminnelsen i stället för som en egen notis.
- **💧 Vatten** i glas à 2,5 dl: *+ Glas* för varje glas. Målet är 8 glas (2 liter) på vilodagar, 10 på löpdagen och 12 (3 liter) på gymdagar, och vanan bockas av sig själv när målet är nått.
- **🔥 Dagar i rad** för varje vana står bredvid namnet. En missad dag i veckan räddas av veckans frysdag (❄️ visar att den är använd) – två missar samma vecka och serien börjar om.
- **⏰ Måltidsrytm**: ligger du efter med kalorierna för tiden på dagen (rak linje från en timme efter väckningen till 21.00) står *Ät nästa gång senast …* under kalorierna i Mat – 3,5 timmar efter senaste maten eller shakeglaset – och en påminnelse kommer då med ett mellanmål som passar. Inga påminnelser efter 20.00, inte när ett shakeglas ändå ska drickas strax efter, och bara när du loggat mat de senaste dagarna.

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

### Viktigt lyser guld

Skriv `> Viktigt` på raden under något så lyser raden guld (allt med *viktig* eller *måste* räknas, till exempel `> Ett måste i dag` eller `> Otroligt viktigt`). Anteckningen blir en guldbricka, raden glöder och de viktiga samlas överst under **Viktigast i dag** – ett tryck där hoppar till raden. När en viktig rad bockas av gnistrar det i guld. Med *minska rörelse* påslaget i telefonen står glöden still och gnistorna stängs av.

### Handla

Fliken **Handla** är en egen lista för inköp, med samma format. Varor läggs till med en rad i taget eller klistras in, **Sortera med Claude** delar upp dem efter var de står i butiken, och **Rensa avbockade** tar bort det som redan är köpt.

## Shake

Dagens shake som app: https://filipkymmer79-pixel.github.io/GymSchema/shake/ – öppna i Safari och välj *Dela → Lägg till på hemskärmen*.

- **Idag** visar receptet i lager i kannan och allt som ska tas fram. Tryck *Slut* på det som saknas, så räknas resten om. **Börja mixa** går igenom omgångarna steg för steg med timers, och efteråt bockas glasen av ett i taget.
- **Recept** ställer in storlek (2 000, 2 500, 2 700 eller 3 000 kcal – 2 700 är grundreceptet), tjocklek, honung, mjölkpulver, mjölksort, mixerkannans storlek och mått eller gram.
- **Näring** visar näringsvärdet och hur stor del av dagsbehovet som shaken och tillskotten täcker.
- **Handla** räknar ut vad som går åt för 1–14 dagar. **Kopiera listan** ger en lista som går att klistra in under Handla i Dagsschema.

Allt sparas bara på telefonen. Näringsvärdena är standardvärden per 100 g (Livsmedelsverket och USDA), och dagsbehoven kommer från de nordiska näringsrekommendationerna 2023. Vasslen är Star Nutrition Whey-80 Naturell och mäts i dl (37 g per dl enligt påsen): 1 dl i alla storlekar. Keson är räknad efter förpackningen (Keso 4 %: 93 kcal, 13 g protein och 0,82 g salt per 100 g) med vitaminer och mineraler från Livsmedelsverket, och apelsinjuicen efter förpackningen (45 kcal och 28 mg C-vitamin per 100 g). Typsnittet är Sofia Sans, under SIL Open Font License (`shake/fonts/LICENSE.txt`).

### Receptet sedan 15 november 2026

- **2 700 kcal är grundreceptet** – samma siffra som GymSchema räknar shaken som under Mat: 2 704 kcal, 133 g protein, ca 16 dl i fyra glas (två omgångar i en mixer på 1,5 liter). En telefon som hade den gamla versionen flyttas en gång till 2 700. Övriga val ligger kvar, och en shake som redan är påbörjad eller mixad följer sitt gamla recept.
- **Bananen är borta** ur alla storlekar. I stället är det **keso** (cottage cheese 4 %; 2½ dl = en burk à 250 g, 2 dl i 2 000) och **1 dl apelsinjuice**.
- Keson ger 32 g protein. Därför är mjölkpulvret halverat till 4 msk och vasslen 1 dl i alla storlekar: proteinet ligger kvar runt 5 g per 100 kcal, kalciumet gick från ca 2 300 till ca 1 650 mg (kalciumvarningen visas inte längre på grundreceptet) och laktosen från ca 47 till ca 34 g. Stänger man av mjölkpulvret tar ½ dl whey dess plats.
- **Inget salt i receptet**, eftersom keson är saltad. Är keson *Slut* kommer saltet (1 krm) tillbaka av sig självt och resten räknas om som vanligt. Keso och juice skruvas aldrig upp för att fylla ut kalorier.
- Keson går i med yoghurten, och sista mixningen säger att kesokornen ska vara helt borta. Juicen går i med bären, hela decilitern i första omgången.
- C-vitaminet täcktes redan av vinbären (ca 115 mg, hela dagsbehovet); juicen lyfter det till ca 145 mg. Utan bananen täcker shaken ca 50 % av B6 (3 000 med banan låg på ca 110 %) och 94 % av kaliumet – resten kommer från maten.
- De fyra storlekarna ger 2 010, 2 500, 2 700 och 3 000 kcal med 100, 125, 133 och 146 g protein.
- Handla räknar keso i burkar à 250 g och juice i liter, och rådet om att frysa bananer är bytt mot råd om keso (finns laktosfri) och juice (100 % juice, inte nektar).
- Kontrollerat med uträkning för alla storlekar, inställningar och varje ingrediens som slut (6 624 kombinationer), och i Chromium på 320, 390 och 430 px: alla flikar, hela mixningen, glasen, flytten från den gamla versionen och en shake som påbörjats i den gamla. Inte provat på en riktig iPhone.

## Telefon-AI-planen

Planen för AI-telefonisten till verkstäder som app: https://filipkymmer79-pixel.github.io/GymSchema/plan/ – öppna i Safari och välj *Dela → Lägg till på hemskärmen*.

- **Plan** har 30 steg i nio delar med datum, från rösten (klar söndag 15 november) till 84 kunder. Steget du ska göra nu lyser gult, och en del som inte blev klar i tid blir röd.
- **Kunder** är verkstäderna du pratar med och var de står: Att kontakta, Kontaktad, Demo visad, Provar gratis, Betalar eller Nej tack. Appen räknar ut vad du tjänar i månaden och om året (5 000 kr per kund och månad, utan moms) och hur många kunder som är kvar till nästa mål. Dagens kontakter räknas mot 10.
- **Manus** har det du säger när du går in hos en verkstad, svar när de tvekar, instruktionerna till AI:n som kopieras rakt in i agenten och meningar att läsa när rösten spelas in.

Allt sparas bara på telefonen.

## Jobbmotorn

Jobbmotorn som app: https://filipkymmer79-pixel.github.io/GymSchema/jobb/ – öppna i Safari och välj *Dela → Lägg till på hemskärmen*.

Appen öppnar Jobbmotorn i Claude. Där letar den upp dagens jobb på Indeed, skriver ett personligt brev till varje med dina egna ord och sparar jobben du har skickat, så att listan är klar för aktivitetsrapporten. Själva motorn körs i Claude, eftersom den använder ditt Claude-konto och din Indeed-koppling.

Appen visar också vad som gäller för aktivitetsrapporten just nu. Mellan den 1 och 14 i månaden lyser rutan gult och visar hur många dagar som är kvar att skicka in förra månadens rapport.
