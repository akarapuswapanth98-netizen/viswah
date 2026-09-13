# Seed Data - 100+ Courses Covering All World Music Traditions

import json

from sqlalchemy.orm import Session

from models.models import Course, Lesson


def seed_database(db: Session):
    """Populate database with courses covering all world music traditions."""

    if db.query(Course).first():
        return

    try:
        # ============================================================
        # GROUP 1: FOUNDATIONS (10 courses)
        # ============================================================
        foundation_courses = [
            Course(title="Music Fundamentals", description="Learn the basics of music theory, notation, and ear training. Build a solid foundation for any instrument.", stage=1, instrument="vocal", difficulty="beginner", image_url="/images/fundamentals.jpg"),
            Course(title="Rhythm & Time Signatures", description="Master rhythm, meter, and time signatures. From simple 4/4 to complex polyrhythms.", stage=1, instrument="drums", difficulty="beginner", image_url="/images/rhythm.jpg"),
            Course(title="Scales & Modes Explained", description="Understand major, minor, and modal scales. Learn how they create mood and character.", stage=1, instrument="piano", difficulty="beginner", image_url="/images/scales.jpg"),
            Course(title="Chord Theory & Progressions", description="Build triads, seventh chords, and common progressions. The harmonic backbone of music.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/chords.jpg"),
            Course(title="Ear Training Bootcamp", description="Develop your ear to identify intervals, chords, and melodies by sound alone.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/ear-training.jpg"),
            Course(title="Music Notation & Reading", description="Read sheet music fluently. Treble, bass, and grand staff.", stage=1, instrument="piano", difficulty="beginner", image_url="/images/notation.jpg"),
            Course(title="Harmony & Counterpoint", description="Two-part and four-part harmony. Bach-style counterpoint principles.", stage=3, instrument="piano", difficulty="advanced", image_url="/images/harmony.jpg"),
            Course(title="Songwriting Fundamentals", description="Write your first songs. Melody, lyrics, and structure.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/songwriting.jpg"),
            Course(title="Music Production Basics", description="DAW setup, recording, mixing fundamentals. Create your first tracks.", stage=1, instrument="keyboard", difficulty="beginner", image_url="/images/production.jpg"),
            Course(title="Performance Skills", description="Stage presence, microphone technique, and overcoming stage fright.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/performance.jpg"),
        ]

        # ============================================================
        # GROUP 2: WESTERN CLASSICAL (12 courses)
        # ============================================================
        classical_courses = [
            Course(title="Classical Piano: Beginner", description="Start your classical piano journey. Proper technique, hand position, and first pieces.", stage=1, instrument="piano", difficulty="beginner", image_url="/images/classical-piano-1.jpg"),
            Course(title="Classical Piano: Intermediate", description="Bach inventions, Mozart sonatas, and Chopin nocturnes.", stage=2, instrument="piano", difficulty="intermediate", image_url="/images/classical-piano-2.jpg"),
            Course(title="Classical Piano: Advanced", description="Liszt etudes, Rachmaninoff concertos, and advanced repertoire.", stage=3, instrument="piano", difficulty="advanced", image_url="/images/classical-piano-3.jpg"),
            Course(title="Violin Foundations", description="Posture, bowing, and first position. Suzuki method basics.", stage=1, instrument="violin", difficulty="beginner", image_url="/images/violin-1.jpg"),
            Course(title="Violin: Scales & Arpeggios", description="Major, minor, and chromatic scales for violin. Positions I-V.", stage=2, instrument="violin", difficulty="intermediate", image_url="/images/violin-2.jpg"),
            Course(title="Baroque Music", description="Bach, Vivaldi, Handel. Basso continuo and ornamentation.", stage=2, instrument="violin", difficulty="intermediate", image_url="/images/baroque.jpg"),
            Course(title="Classical Period", description="Haydn, Mozart, early Beethoven. Sonatas and symphonies.", stage=2, instrument="piano", difficulty="intermediate", image_url="/images/classical-period.jpg"),
            Course(title="Romantic Era", description="Chopin, Liszt, Rachmaninoff. Expressive playing and rubato.", stage=3, instrument="piano", difficulty="advanced", image_url="/images/romantic.jpg"),
            Course(title="Opera & Vocal Classical", description="Art songs, arias, and operatic technique.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/opera.jpg"),
            Course(title="Orchestral Conducting Basics", description="Beat patterns, cueing, and score reading.", stage=3, instrument="vocal", difficulty="advanced", image_url="/images/conducting.jpg"),
            Course(title="Chamber Music", description="String quartets, piano trios. Ensemble playing skills.", stage=3, instrument="violin", difficulty="advanced", image_url="/images/chamber.jpg"),
            Course(title="20th Century Classical", description="Debussy, Stravinsky, Bartok. Impressionism and modernism.", stage=3, instrument="piano", difficulty="advanced", image_url="/images/modern-classical.jpg"),
        ]

        # ============================================================
        # GROUP 3: JAZZ (10 courses)
        # ============================================================
        jazz_courses = [
            Course(title="Jazz Piano Basics", description="Swing feel, basic voicings, and improvisation intro.", stage=1, instrument="piano", difficulty="beginner", image_url="/images/jazz-piano-1.jpg"),
            Course(title="Jazz Standards: Real Book", description="Learn 20 essential jazz standards. Melody, chords, and soloing.", stage=2, instrument="piano", difficulty="intermediate", image_url="/images/real-book.jpg"),
            Course(title="Bebop Language", description="Charlie Parker, Dizzy Gillespie. Fast lines and chromatic approach notes.", stage=3, instrument="saxophone", difficulty="advanced", image_url="/images/bebop.jpg"),
            Course(title="Jazz Improvisation", description="Scales over chords, targeting guide tones, and creating melodic solos.", stage=2, instrument="saxophone", difficulty="intermediate", image_url="/images/jazz-improv.jpg"),
            Course(title="Walking Bass Lines", description="Create smooth bass lines that outline harmony and keep time.", stage=2, instrument="bass", difficulty="intermediate", image_url="/images/walking-bass.jpg"),
            Course(title="Jazz Drums & Swing", description="Ride cymbal patterns, comping, and brush technique.", stage=2, instrument="drums", difficulty="intermediate", image_url="/images/jazz-drums.jpg"),
            Course(title="Latin Jazz", description="Bossa nova, salsa, and Afro-Cuban jazz rhythms.", stage=2, instrument="drums", difficulty="intermediate", image_url="/images/latin-jazz.jpg"),
            Course(title="Jazz Guitar Comping", description="Freddie Green style, chord melody, and shell voicings.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/jazz-guitar.jpg"),
            Course(title="Modal Jazz", description="Miles Davis 'Kind of Blue' approach. Dorian, Mixolydian, and beyond.", stage=3, instrument="saxophone", difficulty="advanced", image_url="/images/modal-jazz.jpg"),
            Course(title="Jazz Fusion", description="Weather Report, Herbie Hancock. Electric jazz and funk integration.", stage=3, instrument="keyboard", difficulty="advanced", image_url="/images/fusion.jpg"),
        ]

        # ============================================================
        # GROUP 4: BLUES (6 courses)
        # ============================================================
        blues_courses = [
            Course(title="Blues Guitar Basics", description="12-bar blues, shuffle rhythm, and pentatonic licks.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/blues-guitar-1.jpg"),
            Course(title="Blues Harmonica", description="Cross harp position, bending, and train rhythms.", stage=1, instrument="harmonica", difficulty="beginner", image_url="/images/blues-harp.jpg"),
            Course(title="Delta Blues Style", description="Fingerpicking, slide guitar, Robert Johnson techniques.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/delta-blues.jpg"),
            Course(title="Chicago Blues", description="Electric blues band format. Muddy Waters, B.B. King.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/chicago-blues.jpg"),
            Course(title="Blues Piano", description="Boogie-woogie left hand, barrelhouse styles.", stage=2, instrument="piano", difficulty="intermediate", image_url="/images/blues-piano.jpg"),
            Course(title="Advanced Blues Soloing", description="Target notes, chromatic passing tones, and blues expression.", stage=3, instrument="guitar", difficulty="advanced", image_url="/images/blues-solo.jpg"),
        ]

        # ============================================================
        # GROUP 5: INDIAN CLASSICAL (12 courses)
        # ============================================================
        indian_courses = [
            Course(title="Hindustani Music: Foundations", description="Sargam, swaras, and the thaat system. North Indian classical basics.", stage=1, instrument="vocal", difficulty="beginner", image_url="/images/hindustani-1.jpg"),
            Course(title="Hindustani Vocal: Ragas", description="Learn 10 essential ragas: Yaman, Bhairav, Bhairavi, and more.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/ragas.jpg"),
            Course(title="Tabla Fundamentals", description="Bayan and dayan techniques. Teentaal and common talas.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/tabla-1.jpg"),
            Course(title="Tabla: Advanced Bols", description="Complex compositions, rela, and kaida patterns.", stage=3, instrument="percussion", difficulty="advanced", image_url="/images/tabla-2.jpg"),
            Course(title="Sitar Basics", description="Meend, gamak, and alap. Introduction to the sitar.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/sitar.jpg"),
            Course(title="Carnatic Music Basics", description="South Indian classical. Melakarta system and kriti form.", stage=1, instrument="vocal", difficulty="beginner", image_url="/images/carnatic-1.jpg"),
            Course(title="Carnatic Vocal: Varnams", description="Alankaras and varnam practice for voice training.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/varnam.jpg"),
            Course(title="Bansuri (Indian Flute)", description="Hindustani bamboo flute. Breath control and raga phrases.", stage=2, instrument="flute", difficulty="intermediate", image_url="/images/bansuri.jpg"),
            Course(title="Tala System Deep Dive", description="Teentaal, Jhaptaal, Ektal, Rupak. Complex rhythmic cycles.", stage=3, instrument="percussion", difficulty="advanced", image_url="/images/tala.jpg"),
            Course(title="Raga Yaman Masterclass", description="Complete study of Raga Yaman. Arohana, avarohana, phrases, and compositions.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/yaman.jpg"),
            Course(title="Raga Bhairav: Morning Ragas", description="Devotional morning ragas. Bhairav, Bilawal thaat exploration.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/bhairav.jpg"),
            Course(title="Indian Music History", description="Vedic chants to modern fusion. 3000 years of Indian classical evolution.", stage=3, instrument="vocal", difficulty="advanced", image_url="/images/indian-history.jpg"),
        ]

        # ============================================================
        # GROUP 6: ARABIC & MIDDLE EASTERN (10 courses)
        # ============================================================
        arabic_courses = [
            Course(title="Arabic Music Fundamentals", description="Maqam system, quarter tones, and Arabic music theory.", stage=1, instrument="vocal", difficulty="beginner", image_url="/images/arabic-1.jpg"),
            Course(title="Maqam Bayati & Hijaz", description="Two most important maqamat. Scales, phrases, and emotions.", stage=2, instrument="oud", difficulty="intermediate", image_url="/images/maqam.jpg"),
            Course(title="Oud Basics", description="Posture, plectrum (risha), and first maqam scales on oud.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/oud.jpg"),
            Course(title="Oud: Advanced Techniques", description="Tremolo, ornamentation, and taqsim improvisation.", stage=3, instrument="guitar", difficulty="advanced", image_url="/images/oud-advanced.jpg"),
            Course(title="Arabic Percussion (Darbuka)", description="Doum, tek, and ka sounds. Maqsum and saidi rhythms.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/darbuka.jpg"),
            Course(title="Turkish Makam System", description="Hicaz, Rast, Hüseyni. Turkish microtonal theory.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/turkish-makam.jpg"),
            Course(title="Persian Dastgah", description="Shur, Homayun, Segah. Iranian classical music system.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/persian.jpg"),
            Course(title="Arabic Vocal (Mawwal)", description="Free-rhythm vocal improvisation. Taqsim and vocal ornaments.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/mawwal.jpg"),
            Course(title="Ney (Middle Eastern Flute)", description="Breath techniques, maqam scales on ney. Sufi tradition.", stage=2, instrument="flute", difficulty="intermediate", image_url="/images/ney.jpg"),
            Course(title="Rhythms of the Middle East", description="Maqsum, Saidi, Malfuf, Chiftetelli. 8 essential rhythms.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/middle-east-rhythm.jpg"),
        ]

        # ============================================================
        # GROUP 7: CELTIC & IRISH (8 courses)
        # ============================================================
        celtic_courses = [
            Course(title="Irish Traditional Basics", description="Dorian and Mixolydian modes. Simple tunes and ornaments.", stage=1, instrument="fiddle", difficulty="beginner", image_url="/images/irish-1.jpg"),
            Course(title="Irish Fiddle: Session Tunes", description="Jigs, reels, and hornpipes. Learn 30 essential tunes.", stage=2, instrument="fiddle", difficulty="intermediate", image_url="/images/irish-fiddle.jpg"),
            Course(title="Tin Whistle Essentials", description="Basic fingerings, breath control, and first tunes.", stage=1, instrument="flute", difficulty="beginner", image_url="/images/tin-whistle.jpg"),
            Course(title="Irish Flute & Uilleann Pipes", description="Simple system flute and bellows-blown pipes.", stage=3, instrument="flute", difficulty="advanced", image_url="/images/irish-flute.jpg"),
            Course(title="Bodhrán & Irish Percussion", description="Frame drum technique, tipper control, and rhythmic patterns.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/bodhran.jpg"),
            Course(title="Celtic Harp", description="Lever harp technique, traditional harp repertoire.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/celtic-harp.jpg"),
            Course(title="Irish Guitar Accompaniment", description="DADGAD tuning, chord voicings, and rhythmic accompaniment.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/irish-guitar.jpg"),
            Course(title="Scottish Highland Traditions", description="Great Highland bagpipe, strathspeys, and marches.", stage=3, instrument="flute", difficulty="advanced", image_url="/images/scottish.jpg"),
        ]

        # ============================================================
        # GROUP 8: FLAMENCO (6 courses)
        # ============================================================
        flamenco_courses = [
            Course(title="Flamenco Guitar Basics", description="Rasgueado, golpe, and basic palos. Soleá rhythm.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/flamenco-1.jpg"),
            Course(title="Flamenco: Bulerías", description="Fastest and most festive palo. 12-beat cycle with accent pattern.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/bulerias.jpg"),
            Course(title="Cante Jondo (Deep Song)", description="Guttural vocal technique, melisma, and emotional expression.", stage=3, instrument="vocal", difficulty="advanced", image_url="/images/cante-jondo.jpg"),
            Course(title="Palmas & Flamenco Percussion", description="Hand clapping patterns, cajón, and compás.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/palmas.jpg"),
            Course(title="Flamenco Dance Rhythms", description="Zapateado footwork and baile accompaniment patterns.", stage=2, instrument="percussion", difficulty="intermediate", image_url="/images/flamenco-dance.jpg"),
            Course(title="Advanced Flamenco Guitar", description="Alzapúa, picado, tremolo, and complex falsetas.", stage=3, instrument="guitar", difficulty="advanced", image_url="/images/flamenco-advanced.jpg"),
        ]

        # ============================================================
        # GROUP 9: LATIN AMERICAN (12 courses)
        # ============================================================
        latin_courses = [
            Course(title="Samba Fundamentals", description="Surdo, tamborim, and pandeiro patterns. Brazilian carnival rhythms.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/samba.jpg"),
            Course(title="Bossa Nova Guitar", description="Tom Jobim style. Syncopated patterns and jazz chords.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/bossa-nova.jpg"),
            Course(title="Tango Basics", description="Bandoneon technique, habanera rhythm, and dramatic phrasing.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/tango.jpg"),
            Course(title="Salsa & Clave", description="Son clave, rumba clave, and salsa band rhythms.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/salsa.jpg"),
            Course(title="Cumbia Rhythms", description="Colombian cumbia with accordion and guacharaca.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/cumbia.jpg"),
            Course(title="Bachata Guitar", description="Romantic Dominican guitar style. Requinto and rhythm.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/bachata.jpg"),
            Course(title="Merengue", description="Fast Dominican dance. Güira and tambora patterns.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/merengue.jpg"),
            Course(title="Son Cubano", description="Roots of salsa. Tres guitar, montuno, and clave.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/son-cubano.jpg"),
            Course(title="Mariachi Basics", description="Vihuela, guitarrón, and trumpet. Mexican folk ensemble.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/mariachi.jpg"),
            Course(title="Andean Music", description="Charango, quena, and siku. Music of the Andes mountains.", stage=1, instrument="flute", difficulty="beginner", image_url="/images/andean.jpg"),
            Course(title="Reggaeton Production", description="Dembow rhythm programming and modern Latin beats.", stage=1, instrument="drums", difficulty="beginner", image_url="/images/reggaeton.jpg"),
            Course(title="Afro-Cuban Percussion", description="Congas, bongos, timbales. Rumba and salsa drumming.", stage=2, instrument="percussion", difficulty="intermediate", image_url="/images/afro-cuban.jpg"),
        ]

        # ============================================================
        # GROUP 10: AFRICAN (8 courses)
        # ============================================================
        african_courses = [
            Course(title="Djembe Fundamentals", description="Bass, tone, and slap. West African drumming basics.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/djembe.jpg"),
            Course(title="West African Polyrhythms", description="Interlocking patterns from Guinea and Mali. 12-pulse rhythms.", stage=2, instrument="percussion", difficulty="intermediate", image_url="/images/polyrhythm.jpg"),
            Course(title="Kora Basics", description="21-string bridge harp. Griot tradition of West Africa.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/kora.jpg"),
            Course(title="Balafon (African Xylophone)", description="Wooden keys with gourd resonators. Bamana tradition.", stage=2, instrument="percussion", difficulty="intermediate", image_url="/images/balafon.jpg"),
            Course(title="Mbira (Thumb Piano)", description="Shona music of Zimbabwe. Sacred mbira dzaVadzimu.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/mbira.jpg"),
            Course(title="Talking Drum", description="Hourglass drum that mimics Yoruba language tones.", stage=2, instrument="percussion", difficulty="intermediate", image_url="/images/talking-drum.jpg"),
            Course(title="Highlife & Afrobeat", description="Fela Kuti rhythms. Ghanaian highlife guitar styles.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/afrobeat.jpg"),
            Course(title="South African Music", description="Mbube, isicathamiya, and maskandi traditions.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/south-african.jpg"),
        ]

        # ============================================================
        # GROUP 11: EAST ASIAN (10 courses)
        # ============================================================
        east_asian_courses = [
            Course(title="Chinese Erhu Basics", description="Two-string fiddle. Bowing, vibrato, and pentatonic melodies.", stage=1, instrument="violin", difficulty="beginner", image_url="/images/erhu.jpg"),
            Course(title="Guzheng (Chinese Zither)", description="21-string plucked zither. Glissando and tremolo techniques.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/guzheng.jpg"),
            Course(title="Pipa (Chinese Lute)", description="Four-string plucked instrument. Tremolo and strumming.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/pipa.jpg"),
            Course(title="Dizi (Chinese Bamboo Flute)", description="Transverse flute with buzzing membrane. Folk and classical.", stage=2, instrument="flute", difficulty="intermediate", image_url="/images/dizi.jpg"),
            Course(title="Japanese Shakuhachi", description="End-blown bamboo flute. Zen meditation and honkyoku.", stage=2, instrument="flute", difficulty="intermediate", image_url="/images/shakuhachi.jpg"),
            Course(title="Koto (Japanese Zither)", description="13-string zither. Tsumi and hajiki techniques.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/koto.jpg"),
            Course(title="Shamisen Basics", description="Three-string lute. Tsugaru and nagauta styles.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/shamisen.jpg"),
            Course(title="Taiko Drumming", description="Japanese barrel drums. Powerful ensemble patterns.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/taiko.jpg"),
            Course(title="Korean Gayageum", description="12-string zither. Sanjo and folk traditions.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/gayageum.jpg"),
            Course(title="Korean Janggu", description="Hourglass drum. Samulnori percussion ensemble.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/janggu.jpg"),
        ]

        # ============================================================
        # GROUP 12: INDONESIAN (6 courses)
        # ============================================================
        indonesian_courses = [
            Course(title="Gamelan Basics", description="Introduction to Javanese and Balinese gamelan ensemble.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/gamelan.jpg"),
            Course(title="Gamelan: Slendro & Pelog", description="Two tuning systems. Saron, bonang, and gong patterns.", stage=2, instrument="percussion", difficulty="intermediate", image_url="/images/slendro-pelog.jpg"),
            Course(title="Balinese Gamelan", description="Gamelan Gong Kebyar. Fast, explosive, interlocking.", stage=3, instrument="percussion", difficulty="advanced", image_url="/images/balinese.jpg"),
            Course(title="Kendang (Gamelan Drum)", description="Leader of the ensemble. Complex drum syllables.", stage=3, instrument="percussion", difficulty="advanced", image_url="/images/kendang.jpg"),
            Course(title="Kecak (Monkey Chant)", description="Balinese vocal percussion. 100+ voices in rhythmic chant.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/kecak.jpg"),
            Course(title="Suling (Balinese Flute)", description="Ring-flute with circular breathing technique.", stage=2, instrument="flute", difficulty="intermediate", image_url="/images/suling.jpg"),
        ]

        # ============================================================
        # GROUP 13: VOCAL TRAINING (8 courses)
        # ============================================================
        vocal_courses = [
            Course(title="Vocal Training Basics", description="Breathing, posture, and first vocal exercises.", stage=1, instrument="vocal", difficulty="beginner", image_url="/images/vocal-1.jpg"),
            Course(title="Intermediate Vocal Skills", description="Vibrato, dynamics, and range extension.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/vocal-2.jpg"),
            Course(title="Advanced Vocal Technique", description="Belting, mix voice, and advanced breath control.", stage=3, instrument="vocal", difficulty="advanced", image_url="/images/vocal-3.jpg"),
            Course(title="Pop Vocal Styling", description="Contemporary pop techniques. Runs, riffs, and ad-libs.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/pop-vocal.jpg"),
            Course(title="R&B Vocal Techniques", description="Melisma, runs, and soulful expression.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/rnb-vocal.jpg"),
            Course(title="Choir & Ensemble Singing", description="Harmony parts, blend, and ensemble skills.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/choir.jpg"),
            Course(title="Music Theatre Vocal", description="Belt, legit, and character voice techniques.", stage=2, instrument="vocal", difficulty="intermediate", image_url="/images/theatre.jpg"),
            Course(title="World Vocal Traditions", description="Yodeling, throat singing, overtone singing, and global vocal styles.", stage=3, instrument="vocal", difficulty="advanced", image_url="/images/world-vocal.jpg"),
        ]

        # ============================================================
        # GROUP 14: GUITAR (8 courses)
        # ============================================================
        guitar_courses = [
            Course(title="Guitar for Beginners", description="First chords, strumming, and simple songs.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/guitar-1.jpg"),
            Course(title="Fingerstyle Guitar", description="Travis picking, classical technique, and fingerpicking patterns.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/fingerstyle.jpg"),
            Course(title="Acoustic Blues Guitar", description="Delta, Piedmont, and country blues fingerpicking.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/acoustic-blues.jpg"),
            Course(title="Classical Guitar", description="Fingerstyle with nylon strings. Sor, Tarrega, Villa-Lobos.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/classical-guitar.jpg"),
            Course(title="Rock Guitar Foundations", description="Power chords, pentatonic solos, and distortion techniques.", stage=1, instrument="guitar", difficulty="beginner", image_url="/images/rock-guitar.jpg"),
            Course(title="Funk Guitar", description="Scratch rhythm, wah-wah, and syncopated comping.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/funk-guitar.jpg"),
            Course(title="Flamenco Guitar Techniques", description="Rasgueado, alzapúa, and palos.", stage=3, instrument="guitar", difficulty="advanced", image_url="/images/flamenco-guitar.jpg"),
            Course(title="Folk & Country Guitar", description="Open tunings, Carter scratch, and flatpicking.", stage=2, instrument="guitar", difficulty="intermediate", image_url="/images/folk-guitar.jpg"),
        ]

        # ============================================================
        # GROUP 15: KEYBOARD & PIANO (8 courses)
        # ============================================================
        piano_courses = [
            Course(title="Piano for Beginners", description="First notes, scales, and easy pieces.", stage=1, instrument="piano", difficulty="beginner", image_url="/images/piano-1.jpg"),
            Course(title="Intermediate Piano", description="Chord progressions, arpeggios, and coordination.", stage=2, instrument="piano", difficulty="intermediate", image_url="/images/piano-2.jpg"),
            Course(title="Pop Piano", description="Contemporary pop accompaniment and patterns.", stage=2, instrument="piano", difficulty="intermediate", image_url="/images/pop-piano.jpg"),
            Course(title="Electronic Music Production", description="Synthesizers, sequencing, and DAW production.", stage=2, instrument="keyboard", difficulty="intermediate", image_url="/images/electronic.jpg"),
            Course(title="Organ & Gospel", description="Hammond organ techniques and gospel accompaniment.", stage=2, instrument="keyboard", difficulty="intermediate", image_url="/images/organ.jpg"),
            Course(title="Music Theory on Piano", description="Visualize harmony, scales, and voicings on keyboard.", stage=1, instrument="piano", difficulty="beginner", image_url="/images/theory-piano.jpg"),
            Course(title="Advanced Voicings", description="Rootless voicings, spread voicings, and quartal harmony.", stage=3, instrument="piano", difficulty="advanced", image_url="/images/voicings.jpg"),
            Course(title="Sight Reading Mastery", description="Read and play unfamiliar music at first sight.", stage=3, instrument="piano", difficulty="advanced", image_url="/images/sight-reading.jpg"),
        ]

        # ============================================================
        # GROUP 16: DRUMS & PERCUSSION (8 courses)
        # ============================================================
        drum_courses = [
            Course(title="Drum Basics", description="Single strokes, paradiddles, and basic rock beats.", stage=1, instrument="drums", difficulty="beginner", image_url="/images/drums-1.jpg"),
            Course(title="Intermediate Drumming", description="Fills, ghost notes, and groove variations.", stage=2, instrument="drums", difficulty="intermediate", image_url="/images/drums-2.jpg"),
            Course(title="Advanced Drumming", description="Polyrhythms, metric modulation, and odd time signatures.", stage=3, instrument="drums", difficulty="advanced", image_url="/images/drums-3.jpg"),
            Course(title="World Percussion", description="Cajón, darbuka, djembe, and frame drums.", stage=2, instrument="percussion", difficulty="intermediate", image_url="/images/world-perc.jpg"),
            Course(title="Cajón Mastery", description="Flamenco and acoustic drumming on the box drum.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/cajon.jpg"),
            Course(title="Marching Percussion", description="Snare drum technique, rolls, and rudiments.", stage=2, instrument="percussion", difficulty="intermediate", image_url="/images/marching.jpg"),
            Course(title="Mallet Percussion", description="Xylophone, marimba, and vibraphone technique.", stage=2, instrument="percussion", difficulty="intermediate", image_url="/images/mallets.jpg"),
            Course(title="Hand Drumming", description="Congas, bongos, and hand technique for various world drums.", stage=1, instrument="percussion", difficulty="beginner", image_url="/images/hand-drums.jpg"),
        ]

        # ============================================================
        # GROUP 17: WIND INSTRUMENTS (8 courses)
        # ============================================================
        wind_courses = [
            Course(title="Flute Fundamentals", description="Tone production, embouchure, and first scales.", stage=1, instrument="flute", difficulty="beginner", image_url="/images/flute-1.jpg"),
            Course(title="Saxophone Basics", description="Embouchure, scales, and first jazz standards.", stage=1, instrument="saxophone", difficulty="beginner", image_url="/images/sax-1.jpg"),
            Course(title="Clarinet Foundations", description="Tone, scales, and classical/ensemble playing.", stage=1, instrument="clarinet", difficulty="beginner", image_url="/images/clarinet.jpg"),
            Course(title="Trumpet Basics", description="Lip buzz, embouchure, and first notes.", stage=1, instrument="trumpet", difficulty="beginner", image_url="/images/trumpet.jpg"),
            Course(title="Saxophone Improvisation", description="Jazz language, bebop scales, and soloing.", stage=3, instrument="saxophone", difficulty="advanced", image_url="/images/sax-improv.jpg"),
            Course(title="World Flutes", description="Bansuri, shakuhachi, quena, and other world flutes.", stage=2, instrument="flute", difficulty="intermediate", image_url="/images/world-flutes.jpg"),
            Course(title="Harmonica Basics", description="Diatonic harmonica. Single notes, bends, and blues.", stage=1, instrument="harmonica", difficulty="beginner", image_url="/images/harmonica.jpg"),
            Course(title="Bass Guitar Fundamentals", description="Walking lines, grooves, and fretboard knowledge.", stage=1, instrument="bass", difficulty="beginner", image_url="/images/bass.jpg"),
        ]

        # ============================================================
        # ALL COURSES COMBINED
        # ============================================================
        all_course_groups = [
            foundation_courses, classical_courses, jazz_courses, blues_courses,
            indian_courses, arabic_courses, celtic_courses, flamenco_courses,
            latin_courses, african_courses, east_asian_courses, indonesian_courses,
            vocal_courses, guitar_courses, piano_courses, drum_courses, wind_courses,
        ]

        all_courses = []
        for group in all_course_groups:
            all_courses.extend(group)

        db.add_all(all_courses)
        db.commit()

        for course in all_courses:
            db.refresh(course)

        # ============================================================
        # LESSONS - 2-4 per course (sampled for key courses)
        # ============================================================
        lessons = []

        # --- Foundation Lessons ---
        lessons.extend([
            Lesson(course_id=all_courses[0].id, title="Introduction to Notes", content="# Introduction to Notes\n\nMusic is built from 7 note names: A B C D E F G. After G, the pattern repeats at a higher pitch (A4 follows G4).\n\n**Key Concepts:**\n- A **half step** is the smallest interval (e.g., E to F)\n- A **whole step** equals two half steps (e.g., C to D)\n- The **chromatic scale** has 12 notes per octave\n\n**Practice:** Say the note names aloud while playing them on a keyboard or guitar.", order=1, lesson_type="theory", duration_minutes=10, quiz_questions=json.dumps([
                {"question": "How many notes are in the musical alphabet?", "options": ["5", "6", "7", "8"], "correct_answer": "7"},
                {"question": "What is a half step?", "options": ["Two piano keys apart", "The smallest interval", "A whole note", "A rest"], "correct_answer": "The smallest interval"}
            ])),
            Lesson(course_id=all_courses[0].id, title="Rhythm Basics", content="# Rhythm Basics\n\nRhythm is the pattern of sounds and silences in time.\n\n**Key Concepts:**\n- **Beat**: The steady pulse of music\n- **Tempo**: Speed of the beat (BPM)\n- **Note Values**: Whole, half, quarter, eighth, sixteenth\n- **Time Signatures**: 4/4 (common), 3/4 (waltz), 6/8 (compound)\n\n**Practice:** Tap your foot to a metronome at 80 BPM while counting 1-2-3-4.", order=2, lesson_type="theory", duration_minutes=15, quiz_questions=json.dumps([
                {"question": "How many beats in a 4/4 bar?", "options": ["2", "3", "4", "6"], "correct_answer": "4"},
                {"question": "What note value gets one beat in 4/4?", "options": ["Whole", "Half", "Quarter", "Eighth"], "correct_answer": "Quarter"}
            ])),
            Lesson(course_id=all_courses[0].id, title="Major Scale Construction", content="# Major Scale Construction\n\nThe major scale follows the pattern: W-W-H-W-W-W-H\n\n**C Major Scale:**\nC (W) D (W) E (H) F (W) G (W) A (W) B (H) C\n\nThis pattern works starting on any note. Try it on G: G A B C D E F# G\n\n**Practice:** Play the C major scale on your instrument, saying each note name aloud.", order=3, lesson_type="practice", duration_minutes=20, quiz_questions=json.dumps([
                {"question": "What is the major scale pattern?", "options": ["W-W-H-W-W-W-H", "W-H-W-W-H-W-W", "H-W-W-W-H-W-W", "W-W-W-H-W-W-H"], "correct_answer": "W-W-H-W-W-W-H"},
                {"question": "What is the 5th note of C major?", "options": ["E", "F", "G", "A"], "correct_answer": "G"}
            ])),
            Lesson(course_id=all_courses[0].id, title="Music Theory Quiz", content="Test your foundational knowledge!", order=4, lesson_type="quiz", duration_minutes=10, quiz_questions=json.dumps([
                {"question": "How many half steps in an octave?", "options": ["7", "8", "10", "12"], "correct_answer": "12"},
                {"question": "What is the relative minor of C major?", "options": ["D minor", "E minor", "A minor", "G minor"], "correct_answer": "A minor"}
            ])),
        ])

        # --- Indian Classical Lessons ---
        lessons.extend([
            Lesson(course_id=all_courses[40].id, title="Sargam: The Indian Notes", content="# Sargam\n\nIndian classical music uses 7 notes called **swaras**:\n\n| Sargam | Western | Ratio |\n|--------|---------|-------|\n| Sa | C | 1.0 |\n| Re | D | 1.122 |\n| Ga | E | 1.260 |\n| Ma | F | 1.335 |\n| Pa | G | 1.498 |\n| Dha | A | 1.682 |\n| Ni | B | 1.888 |\n\n**Shuddha** = natural, **Komal** = flat, **Tivra** = sharp\n\n**Practice:** Sing Sa Re Ga Ma Pa Dha Ni Sa (ascending) and Sa Ni Dha Pa Ma Ga Re Sa (descending).", order=1, lesson_type="theory", duration_minutes=15, quiz_questions=json.dumps([
                {"question": "What is the Indian equivalent of 'C'?", "options": ["Re", "Ga", "Sa", "Pa"], "correct_answer": "Sa"},
                {"question": "What does 'Komal' mean?", "options": ["Sharp", "Flat", "Natural", "Natural"], "correct_answer": "Flat"}
            ])),
            Lesson(course_id=all_courses[40].id, title="Thaat System", content="# Thaat System\n\nBhatkhande divided Hindustani music into 10 **thaats** (scales):\n\n1. **Bilawal** - All shuddha (like Major)\n2. **Khamaj** - Flat Ni\n3. **Kafi** - Flat Ga, Ni\n4. **Asavari** - Flat Ga, Dha, Ni\n5. **Bhairavi** - All komal\n6. **Bhairav** - Flat Re, Dha\n7. **Marwa** - Flat Re, no Pa\n8. **Purvi** - Flat Re, Dha, no Pa\n9. **Todi** - Flat Re, Ga, Ni, Tivra Ma\n10. **Yaman** - Tivra Ma\n\nEach thaat is the parent scale for many ragas.", order=2, lesson_type="theory", duration_minutes=20, quiz_questions=json.dumps([
                {"question": "How many thaats are there?", "options": ["7", "8", "10", "12"], "correct_answer": "10"},
                {"question": "Which thaat has all shuddha swaras?", "options": ["Bhairav", "Bilawal", "Kafi", "Yaman"], "correct_answer": "Bilawal"}
            ])),
            Lesson(course_id=all_courses[40].id, title="Introduction to Raga", content="# What is a Raga?\n\nA raga is more than a scale — it's a melodic framework with:\n- **Arohana**: Ascending notes\n- **Avarohana**: Descending notes\n- **Vadi**: Primary note (king)\n- **Samvadi**: Secondary note (minister)\n- **Time**: When it should be performed\n- **Mood**: Emotional character\n\n**Beginner Ragas:**\n- **Yaman**: Evening, peaceful (uses Tivra Ma)\n- **Bhairav**: Morning, devotional (flat Re, Dha)\n- **Bhoopali**: Evening, joyful (pentatonic)\n\n**Practice:** Listen to Raga Yaman alap and identify the phrases.", order=3, lesson_type="theory", duration_minutes=20, quiz_questions=json.dumps([
                {"question": "What is the 'vadi' of a raga?", "options": ["The scale", "The primary note", "The time of day", "The instrument"], "correct_answer": "The primary note"},
                {"question": "When is Raga Yaman performed?", "options": ["Morning", "Afternoon", "Evening", "Night"], "correct_answer": "Evening"}
            ])),
            Lesson(course_id=all_courses[40].id, title="Teentaal Rhythm", content="# Teentaal (Tintal)\n\nMost common tala in Hindustani music.\n\n**Structure:** 16 beats divided 4+4+4+4\n\n```\nDha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Ta Dhin Dhin Dha\n  1    2    3    4     5    6    7    8    9   10   11  12   13  14   15   16\n```\n\n**Sam**: Beat 1 (strongest)\n**Khali**: Beat 9 (empty, wave hand)\n**Tali**: Beats 1 and 5 (clap)\n\n**Practice:** Clap the tala while reciting bols.", order=4, lesson_type="practice", duration_minutes=15, quiz_questions=json.dumps([
                {"question": "How many beats in Teentaal?", "options": ["7", "10", "12", "16"], "correct_answer": "16"},
                {"question": "Which beat is 'Khali' in Teentaal?", "options": ["1", "5", "9", "13"], "correct_answer": "9"}
            ])),
        ])

        # --- Jazz Lessons ---
        lessons.extend([
            Lesson(course_id=all_courses[20].id, title="Swing Feel", content="# Swing Rhythm\n\nSwing is the heartbeat of jazz. Instead of straight eighth notes, jazz musicians play a **triplet-based** subdivision.\n\n**Straight vs Swing:**\n- Straight: | 1 & 2 & 3 & 4 & |\n- Swing: | 1 a 2 a 3 a 4 a | (long-short pattern)\n\n**The Ride Pattern:**\n```\nRide:  | x . x . | x . x . | (ding ding-a-ding)\nHi-hat: | . x . x | . x . x | (on 2 and 4)\n```\n\n**Practice:** Count '1-trip-let 2-trip-let' while tapping. This is your swing grid.", order=1, lesson_type="theory", duration_minutes=15, quiz_questions=json.dumps([
                {"question": "What rhythm feel defines jazz?", "options": ["Straight", "Swing", "Latin", "Bossa"], "correct_answer": "Swing"},
                {"question": "On which beats does the hi-hat close?", "options": ["1 and 3", "2 and 4", "All beats", "Only beat 1"], "correct_answer": "2 and 4"}
            ])),
            Lesson(course_id=all_courses[20].id, title="II-V-I Progression", content="# The II-V-I Progression\n\nThe most important chord progression in jazz.\n\n**In C Major:**\n- **II** = Dm7 (D-F-A-C)\n- **V** = G7 (G-B-D-F)\n- **I** = Cmaj7 (C-E-G-B)\n\n**Voice Leading:**\n- 7th of each chord resolves down by half step to the 3rd of the next\n- This creates smooth, connected harmony\n\n**Practice:** Play II-V-I in all 12 keys. Start with C, F, Bb, Eb.", order=2, lesson_type="theory", duration_minutes=20, quiz_questions=json.dumps([
                {"question": "What is the II chord in C major?", "options": ["Em7", "Dm7", "Fm7", "Am7"], "correct_answer": "Dm7"},
                {"question": "How many keys should you practice II-V-I in?", "options": ["5", "7", "10", "12"], "correct_answer": "12"}
            ])),
            Lesson(course_id=all_courses[20].id, title="Pentatonic Soloing", content="# Pentatonic Scales for Jazz\n\nThe minor pentatonic is the foundation of blues and jazz soloing.\n\n**A Minor Pentatonic:** A C D E G\n\n**Adding the Blue Note:** A C D Eb E G\n\n**Patterns to Practice:**\n1. Ascending/descending scale\n2. Three-note-per-string patterns\n3. String skipping arpeggios\n4. Chromatic approach notes\n\n**Tips:**\n- Target chord tones on strong beats\n- Use chromatic notes as passing tones\n- Leave space between phrases", order=3, lesson_type="practice", duration_minutes=20, quiz_questions=json.dumps([
                {"question": "What is the 'blue note'?", "options": ["Major 3rd", "Flat 5th", "Sharp 9th", "Root"], "correct_answer": "Flat 5th"},
                {"question": "How many notes in a pentatonic scale?", "options": ["4", "5", "6", "7"], "correct_answer": "5"}
            ])),
        ])

        # --- Flamenco Lessons ---
        lessons.extend([
            Lesson(course_id=all_courses[55].id, title="Compás: The Flamenco Pulse", content="# Compás\n\nCompás is the rhythmic cycle of flamenco.\n\n**12-Beat Palos (Soleá, Bulerías):**\n```\n1  2  3  4  5  6  7  8  9  10 11 12\n         ↑        ↑     ↑      ↑\n        3        6     8     10\n```\n**Accent pattern: 3-6-8-10**\n\n**4-Beat Palos (Tangos, Tientos):**\nAccent on beats 2 and 4\n\n**Practice:** Count to 12 while clapping the accent pattern. Speed up gradually.", order=1, lesson_type="theory", duration_minutes=15, quiz_questions=json.dumps([
                {"question": "How many beats in Soleá compás?", "options": ["4", "6", "8", "12"], "correct_answer": "12"},
                {"question": "What is the accent pattern?", "options": ["1-4-7-10", "3-6-8-10", "2-5-9-12", "1-3-5-7"], "correct_answer": "3-6-8-10"}
            ])),
            Lesson(course_id=all_courses[55].id, title="Rasgueado Technique", content="# Rasgueado\n\nThe signature strumming technique of flamenco guitar.\n\n**Basic Rasgueado (3 fingers):**\n1. Pinky (e) flicks outward\n2. Ring (a) flicks outward\n3. Middle (m) flicks outward\n\n**Pattern:** p-i-m-a-e (thumb-index-middle-ring-pinky)\n\n**Tips:**\n- Keep wrist relaxed\n- Fingers should flick outward, not downward\n- Start slow, speed comes with practice\n\n**Practice:** Do 5 minutes of rasgueado exercises daily. Start at 60 BPM.", order=2, lesson_type="practice", duration_minutes=20, quiz_questions=json.dumps([
                {"question": "What does rasgueado mean?", "options": ["Plucking", "Scratching/strumming", "Tapping", "Bending"], "correct_answer": "Scratching/strumming"},
                {"question": "Which fingers are used?", "options": ["Thumb only", "Index only", "All fingers", "Pinky only"], "correct_answer": "All fingers"}
            ])),
        ])

        # --- Samba Lessons ---
        lessons.extend([
            Lesson(course_id=all_courses[63].id, title="Samba Rhythm Basics", content="# Samba Rhythm\n\nSamba is the heart of Brazilian carnival.\n\n**Basic Surdo Pattern (2/4):**\n```\nBeat: 1  &  2  &\nSurdo: X  .  x  .  (heavy-light)\n```\n\n**Pandeiro Pattern:**\n```\nBeat: 1  &  2  &\nPad:   X  .  x  .  (bass-tone-slap-tone)\n```\n\n**Key Elements:**\n- Strong beat on 2 (not 1!)\n- Syncopation is essential\n- Multiple instruments layer together\n\n**Practice:** Clap the surdo pattern while counting. Add pandeiro sounds.", order=1, lesson_type="theory", duration_minutes=15, quiz_questions=json.dumps([
                {"question": "Which beat is strongest in samba?", "options": ["1", "2", "3", "4"], "correct_answer": "2"},
                {"question": "What time signature is samba?", "options": ["4/4", "3/4", "2/4", "6/8"], "correct_answer": "2/4"}
            ])),
        ])

        # --- Celtic Lessons ---
        lessons.extend([
            Lesson(course_id=all_courses[51].id, title="Irish Modes", content="# Celtic Modes\n\nIrish traditional music primarily uses two modes:\n\n**Dorian Mode (most common):**\nD E F G A B C D\n- Minor with raised 6th\n- Warm and flowing\n- Used in hundreds of jigs and reels\n\n**Mixolydian Mode:**\nG A B C D E F G\n- Major with flat 7th\n- Lively and earthy\n- Used in dance tunes\n\n**Practice:** Play scales in D Dorian and G Mixolydian on your instrument.", order=1, lesson_type="theory", duration_minutes=15, quiz_questions=json.dumps([
                {"question": "What is the most common Celtic mode?", "options": ["Major", "Minor", "Dorian", "Locrian"], "correct_answer": "Dorian"},
                {"question": "What makes Dorian different from natural minor?", "options": ["Flat 3rd", "Raised 6th", "Flat 7th", "Raised 4th"], "correct_answer": "Raised 6th"}
            ])),
        ])

        # --- Blues Lessons ---
        lessons.extend([
            Lesson(course_id=all_courses[30].id, title="12-Bar Blues", content="# 12-Bar Blues\n\nThe foundation of all blues music.\n\n**Basic Progression:**\n```\n| I  | I  | I  | I  |\n| IV | IV | I  | I  |\n| V  | IV | I  | V  |\n```\n\n**In the key of A:**\n```\n| A7 | A7 | A7 | A7 |\n| D7 | D7 | A7 | A7 |\n| E7 | D7 | A7 | E7 |\n```\n\n**Shuffle Rhythm:**\nPlay eighth notes with a swing triplet feel.\n\n**Practice:** Play the 12-bar blues in A, then try E and G.", order=1, lesson_type="theory", duration_minutes=15, quiz_questions=json.dumps([
                {"question": "How many bars in a standard blues?", "options": ["8", "12", "16", "24"], "correct_answer": "12"},
                {"question": "What is the IV chord in A blues?", "options": ["A7", "D7", "E7", "G7"], "correct_answer": "D7"}
            ])),
        ])

        db.add_all(lessons)
        db.commit()
        print(f"Database seeded successfully with {len(all_courses)} courses and {len(lessons)} lessons!")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
