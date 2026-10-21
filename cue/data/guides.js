// Micro adjustments. photo: set to { before: "path", after: "path" } to swap the sketch for real photos of the same model.
const FIXES = [
  { area: "Double chin", fig: "chin", name: "Forehead to the lens", before: "Head pulls back toward the neck when the client is nervous.", cue: "Push your forehead toward the camera, then tip your chin down just a little.", why: "Stretches the skin under the jaw and draws a clean jawline.", plus: "The single biggest tweak for fuller faces. It feels strange to the client, so tell them it will.", photo: null },
  { area: "Double chin", fig: "chin", name: "Camera slightly above", before: "Lens at chin level or lower, looking up at the jaw.", cue: "I'm going to stand on this step. Bring your eyes up to me, not your chin.", why: "A slightly higher lens hides the area under the chin and makes the eyes look bigger.", plus: "For fuller faces go a few inches higher than you would for other clients.", photo: null },
  { area: "Double chin", fig: "chin", name: "Tongue to the roof", before: "Soft area under the chin while smiling.", cue: "Press your tongue to the roof of your mouth and keep smiling.", why: "Tightens the muscles under the chin. Nobody can see it happening.", plus: "Works with every face. Combine with forehead forward.", photo: null },
  { area: "Double chin", fig: "chin", name: "Out, then down", before: "Client lifts the chin up to fix it, which shows the neck and nostrils.", cue: "Chin out toward me like a turtle, then down a touch.", why: "Up only moves the problem. Out and down defines the jaw.", plus: "If they lift the chin, give a laughing reset and try again.", photo: null },
  { area: "Arms", fig: "arms", name: "Air between arm and body", before: "Arm pressed flat against the side, which spreads it wider on camera.", cue: "Lift your elbow just an inch away from your body.", why: "A small gap shows the waist and keeps the arm its true size.", plus: "The most requested fix from plus-size clients. Do it in almost every standing pose.", photo: null },
  { area: "Arms", fig: "arms", name: "Elbow back, not out", before: "Hand on hip with elbow pointing straight out to the side.", cue: "Hand at your natural waist, now point that elbow back behind you.", why: "Narrows the arm angle and defines the waist.", plus: "Hand rests at the narrowest point of the waist, not the hip bone.", photo: null },
  { area: "Arms", fig: "arms", name: "Show the side of the arm", before: "Flat back of the upper arm faces the lens.", cue: "Turn your arm so your thumb points toward me.", why: "The side of the arm is slimmer than the back of it.", plus: "Pairs well with angling the body 45 degrees.", photo: null },
  { area: "Arms", fig: "arms", name: "Soft hands", before: "Flat palms or tight fists pulling attention.", cue: "Shake out your hands. Now just let your fingers rest lightly.", why: "Relaxed hands look elegant and don't distract.", plus: "Show the edge of the hand, never the full palm or back.", photo: null },
  { area: "Belly", fig: "belly", name: "Turn 45 degrees", before: "Body square to the camera, the widest view.", cue: "Turn your hips halfway away from me, keep your face toward me.", why: "An angled body shows shape and narrows the waist.", plus: "Start almost every plus-size pose from here.", photo: null },
  { area: "Belly", fig: "belly", name: "Lean from the hips", before: "Leaning back or slouching, which pushes the belly toward the lens.", cue: "Lean your top half slightly toward me, from your hips.", why: "Whatever is closest to the lens looks biggest. Bring the face closest.", plus: "Keep the lean small, about the angle of a friendly hello.", photo: null },
  { area: "Belly", fig: "belly", name: "Sit on the front edge", before: "Sitting back into a chair, which folds the middle.", cue: "Scoot to the front edge of the seat and sit tall, like a string is pulling your head up.", why: "Keeps the torso long and avoids folds.", plus: "Angle the knees away from the camera too.", photo: null },
  { area: "Belly", fig: "belly", name: "Give the hands a job at the waist", before: "Hands hanging with nothing to do, body looks flat.", cue: "Hold your jacket open, or rest one hand on your waist.", why: "Creates vertical lines and waist definition.", plus: "An open jacket or long cardigan gives long lines down the body.", photo: null },
  { area: "Shoulders", fig: "shoulders", name: "Drop the shoulders", before: "Shoulders creep up toward the ears from nerves.", cue: "Big breath in. Now let it all out and let your shoulders fall.", why: "Lengthens the neck and relaxes the whole face.", plus: "Repeat this every few minutes. Tension sneaks back.", photo: null },
  { area: "Shoulders", fig: "shoulders", name: "Angle the shoulders", before: "Square shoulders fill the whole frame.", cue: "Turn your shoulders so one is a little closer to me.", why: "Narrows the shoulder line and adds depth.", plus: "Great for broad shoulders too.", photo: null },
  { area: "Shoulders", fig: "shoulders", name: "Roll them back", before: "Shoulders rounded forward, chest caved.", cue: "Roll your shoulders up, back and down.", why: "Opens the chest and looks confident.", plus: "Don't overdo it. A soft roll, not a military stance.", photo: null },
  { area: "Legs", fig: "legs", name: "Weight on the back foot", before: "Weight on both feet, knees locked.", cue: "Shift your weight onto your back foot and soften your front knee.", why: "Relaxes the stance and narrows the hips.", plus: "The foundation of almost every standing pose.", photo: null },
  { area: "Legs", fig: "legs", name: "Point the front toe", before: "Both feet flat and facing forward.", cue: "Point your front toe right at me.", why: "Lengthens the leg line.", plus: "Combine with a bent front knee for curves.", photo: null },
  { area: "Legs", fig: "legs", name: "Cross at the ankles", before: "Seated with knees apart or legs squashed together.", cue: "Cross your ankles and angle your knees away from me.", why: "Long, elegant legs and a smaller seated profile.", plus: "Sit on the front edge of the seat first.", photo: null },
  { area: "Legs", fig: "legs", name: "Lower camera for full-length", before: "Shooting full-length from eye level, which shortens the legs.", cue: "I'm going to drop down to waist height for this one.", why: "A lower lens makes legs look longer and the body proportional.", plus: "Keep the lens no lower than waist for plus-size full-length shots.", photo: null }
];

const SHY = {
  adults: [
    ["Camera down for five minutes", "Start with a walk and chat before you lift the camera.", "Every session"],
    ["Show them a great frame", "In the first ten minutes, show one beautiful shot on the back of the camera.", "Nervous clients"],
    ["The worst pose ever", "Ask them to do the most dramatic, cheesy model pose they can. Laughter follows.", "Stiff couples and groups"],
    ["Fake laugh, real laugh", "Ask for a loud fake laugh. It almost always turns into a real one.", "Anyone"],
    ["Breathe out on three", "Count to three and have them exhale as you shoot.", "Tense faces"],
    ["Give them a job", "Hand them a coffee, a jacket or flowers to hold.", "People who don't know what to do with their hands"],
    ["Mirror me", "Do the pose yourself, a little exaggerated, and have them copy you.", "Clients who don't understand directions"],
    ["Their playlist", "Ask what music they love and play it quietly.", "Studio and indoor shoots"],
    ["Talk about their thing", "Ask about their dog, their job, their partner, or their trip.", "Headshots and solo portraits"],
    ["Eyes closed reset", "Close your eyes, take a breath, open them on my count.", "Mid-session slumps"],
    ["Specific compliments", "Say exactly what looks good: 'that angle on your jaw is great'.", "Clients who are self-conscious"],
    ["Walk and talk", "Keep them moving while you talk. Stillness feels awkward.", "Couples and corporate"]
  ],
  kids: [
    ["Don't you dare smile", "Tell them if they smile it will break your camera. They will smile.", "Ages 3 to 8"],
    ["Sticker on the lens", "Put a small sticker on top of the lens and ask them to find it.", "Ages 1 to 5"],
    ["Simon says", "Play Simon says with poses: Simon says touch your nose, Simon says hug mom.", "Ages 3 to 8"],
    ["Freeze dance", "Play a song. When it stops, everyone freezes.", "Ages 3 to 10 and families"],
    ["Race me", "Race from the tree to you. Shoot as they run.", "High-energy kids"],
    ["Silly word", "Ask them to say 'stinky socks', 'pickle' or 'booger' instead of cheese.", "Ages 3 to 10"],
    ["I spy", "Play I spy. Their eyes go where you want them.", "Kids who won't look at you"],
    ["Parent behind you", "Have a parent stand right behind you making silly faces.", "Babies and toddlers"],
    ["Their turn to shoot", "Let them take one photo of you with a kid camera or your phone.", "Shy kids"],
    ["Animal noises", "Ask what a cow says, then a cat, then a fish.", "Ages 2 to 5"],
    ["Must-haves first", "Get the group shot in the first ten minutes, then let them play.", "Every family session"],
    ["Snack break", "Plan a snack break halfway. Shoot the snack moment too.", "Toddlers and long sessions"],
    ["Reward chart", "Show a sticker chart. Each pose earns a sticker.", "Ages 3 to 7"],
    ["Whisper game", "Whisper a funny word to them and ask them to whisper it to mom.", "Shy kids and siblings"]
  ]
};

const HEIGHTS = [
  ["Above eye level", "Slims the face and jaw, eyes look bigger.", "Headshots, plus-size close-ups, double chin concerns, mature clients."],
  ["Eye level", "Honest and neutral.", "Corporate headshots and documentary moments."],
  ["Chest height", "Natural proportions for half-body shots.", "Three-quarter portraits and couples."],
  ["Waist height", "Legs look longer and the body looks proportional.", "Full-length portraits, dresses, maternity profiles."],
  ["Knee height and lower", "Powerful and tall, but enlarges the chin area.", "Sweet 16 runway shots, kids at their level. Avoid for close-ups."]
];

const ANGLES = [
  ["Plus size", "Slightly above for close-ups, waist height for full-length.", "Three-quarter or full-length. Don't crop at the widest point.", "Use a longer lens (85mm or more) to compress and flatter."],
  ["Petite", "Waist height or a little lower.", "Vertical frames, include the feet, leave a little room above the head.", "Shoot full-length often. Pointed toes add length."],
  ["Tall", "Chest height.", "Crop mid-thigh rather than at the knees.", "Seated poses help when standing next to shorter people."],
  ["Broad shoulders", "Slightly above eye level.", "Angle the body 45 degrees, crop at mid-upper arm.", "Lean the far shoulder away."],
  ["Mature clients", "Above eye level.", "Head-and-shoulders or three-quarter.", "Soft window light and 85 to 105mm smooth skin texture."],
  ["Kids", "Get down to their eye level.", "Loose framing so you don't lose them when they move.", "Fast shutter (1/500 or faster) for wiggles."],
  ["Couples with a height difference", "Chest height.", "Put the shorter partner closer to the camera or on a step.", "Seated poses even things out."],
  ["Maternity", "Waist height.", "Profile and horizontal frames show the silhouette.", "Leave space in front of the bump."],
  ["Groups", "Above, from a step or ladder.", "Tight cluster, nobody at the edge of the frame.", "f/5.6 to f/8 so every face is sharp."],
  ["Headshots", "Eye level or slightly above.", "Cropping the top of the head is fine. Never crop the chin.", "85 to 135mm lens for natural features."]
];

const CROP_RULE = "Never crop at a joint (wrist, elbow, knee or ankle). Crop between joints, like mid-thigh or mid-upper-arm.";

const LIGHT = [
  { name: "Window light", img: "photos/light-window.webp", imgAlt: "Window light guide: big window, positioning, catchlights, leaning toward the light, filling shadows and simple poses", look: "Soft, directional and flattering. Great for skin.", place: "Subject one to three steps from a big window, turned 45 degrees toward it.", tweaks: ["Turn the face toward the window until both eyes have catchlights.", "Have them lean toward the light, not away.", "Use a white wall or reflector on the shadow side for less contrast.", "Seated and close-up poses work best."], best: "Bridal prep, maternity, plus-size close-ups, newborn and headshots.", avoid: "Direct sun through the glass. Use sheer curtains if needed." },
  { name: "Open shade", img: "photos/light-open-shade.webp", imgAlt: "Open shade guide: shade edge, facing the open sky, bright eyes, sun spots, movement, fill light and white balance", look: "Even and soft with no squinting.", place: "Just inside the edge of shade from a building or tree, facing the open sky.", tweaks: ["Step the subject toward the edge of the shade for brighter eyes.", "Watch for dappled light spots on faces.", "Great for walking poses and kids running.", "Use a reflector to bring light under the eyes."], best: "Family sessions, kids, midday shoots and groups.", avoid: "Green color cast from grass and trees. Check your white balance." },
  { name: "Golden hour", img: "photos/light-golden-hour.webp", imgAlt: "Golden hour guide: timing, sun placement, lighting the face, exposure, movement, flare, silhouettes and rim light", look: "Warm, glowing and dreamy.", place: "The hour before sunset. Put the sun behind or beside the subject.", tweaks: ["Backlight hair for a glowing outline.", "Silhouette poses work great against the sun.", "Movement poses (twirls, walks) catch the light beautifully.", "Expose for the face, not the sky."], best: "Couples, engagement, maternity, Sweet 16 and weddings.", avoid: "Shooting straight into the sun without a lens hood. Watch the flare." },
  { name: "The beach", img: "photos/light-beach.webp", imgAlt: "Beach guide: golden hour, water to the side, walking the waterline, facing into the wind, barefoot, relaxed poses and seated knees angled", look: "Bright and open, with lots of reflected light.", place: "Golden hour is best. Put the sun behind them and the water to the side.", tweaks: ["Have them walk along the waterline for natural movement.", "Wind: face them into the wind so hair blows back, not into faces.", "Bare feet look relaxed. Shoes in the sand look odd.", "Sit on the sand with knees angled, not cross-legged."], best: "Couples, families and maternity.", avoid: "Midday sun overhead. It creates harsh shadows under the eyes." },
  { name: "The city", img: "photos/light-city.webp", imgAlt: "City guide: open shade, clean backdrops, relaxed leans, movement, reflections, leading lines and checking behind the head", look: "Edgy, modern and full of texture.", place: "Use alleys and covered streets as open shade. Find clean walls and doorways.", tweaks: ["Lean poses on walls, doorways and railings.", "Walking poses on crosswalks and sidewalks.", "Use windows and reflections for creative frames.", "Leading lines (streets, buildings) point to the subject."], best: "Corporate, couples, Sweet 16 and friends.", avoid: "Busy backgrounds behind heads. Watch for signs and poles." }
];

const QUESTIONS = [
  "What are your names (and how do you say them)?",
  "What type of session is this, and what's the occasion?",
  "Who will be in the photos? Include ages for kids, and any pets.",
  "Where do you want to shoot, or should I suggest a spot?",
  "What are three words you want people to feel when they see these photos?",
  "Are there any photos you've seen and loved? Send me links or screenshots.",
  "Is there anything you're self-conscious about that you'd like me to know?",
  "Any must-have shots or groupings?",
  "How will you use these photos (wall art, website, social, cards)?",
  "What will you be wearing? Send me photos of outfit options.",
  "Anything that helps you relax (music, a snack, a friend along)?",
  "Any mobility needs, allergies or health things I should plan for?",
  "For kids: what do they love right now (characters, games, snacks)?",
  "Anything else you'd like me to know?"
];

const CHECKLIST = {
  "Gear": ["Two camera bodies, or one plus a backup", "Charged batteries (plus spares)", "Formatted memory cards", "Portrait lens (85mm) and a wide lens", "Reflector", "Flash and spare AA batteries", "Lens cloth", "Step stool for high angles", "Kids kit: bubbles, stickers, a squeaky toy"],
  "Location": ["Scouted at the same time of day", "Checked sunset or golden hour time", "Permit or permission if needed", "Backup spot in case of rain", "Parking and restroom info sent to the client", "Weather checked the day before"],
  "Session flow": ["Questionnaire answered and reviewed", "Pose picks from the client reviewed", "Session flow chosen in Session Mode", "Must-have shots list ready", "Outfit changes planned", "Warm-up activity picked", "Wrap-up: sneak peek and next steps explained"]
};

const WEAR = [
  { type: "couple", palette: [["Oatmeal", "#d8c9b0"], ["Sage", "#9cab8f"], ["Dusty blue", "#8ea3b7"], ["Charcoal", "#3d4045"], ["Rust", "#a85a3a"]], fabrics: "Knits, linen, denim, suede.", pairs: ["One in a flowy dress in sage, one in a cream knit and dark jeans.", "Both in neutrals, one adds a rust accent.", "Dressy look: charcoal suit with a dusty blue dress."], avoid: "Matching outfits, neon, big logos.", mood: "Cozy, warm, coordinated" },
  { type: "wedding", palette: [["Ivory", "#f3ecdf"], ["Blush", "#e8c5bd"], ["Champagne", "#d9c39a"], ["Eucalyptus", "#8fa596"], ["Navy", "#2c3a54"]], fabrics: "Satin, chiffon, tulle, wool suiting.", pairs: ["Bridesmaids in mix-and-match shades of blush and champagne.", "Groomsmen in navy with eucalyptus ties.", "Bride in ivory with soft green florals."], avoid: "Very shiny fabrics that create hot spots, clashing bright colors in the party.", mood: "Romantic, timeless, soft" },
  { type: "maternity", palette: [["Cream", "#efe6d6"], ["Terracotta", "#b9694b"], ["Soft pink", "#e7bfb6"], ["Olive", "#7c8059"], ["White", "#fbfaf7"]], fabrics: "Stretchy jersey, chiffon gowns, ribbed knits.", pairs: ["Fitted ribbed dress in cream.", "Flowy chiffon gown in soft pink for golden hour.", "Partner in olive or white to complement."], avoid: "Loose, boxy tops that hide the bump.", mood: "Glowing, soft, natural" },
  { type: "corporate", palette: [["Navy", "#26324a"], ["Graphite", "#3f4247"], ["Crisp white", "#f7f7f5"], ["Burgundy", "#6e2a33"], ["Teal", "#2f6b6b"]], fabrics: "Wool suiting, cotton shirts, silk blouses.", pairs: ["Navy blazer with a crisp white shirt.", "Graphite suit with a burgundy tie or blouse.", "Teal top under a neutral jacket to match your brand."], avoid: "Busy patterns, thin stripes (they flicker on screens), wrinkled shirts.", mood: "Sharp, trustworthy, modern" },
  { type: "kids", palette: [["Mustard", "#d4a43a"], ["Denim", "#5d7898"], ["Cream", "#efe6d6"], ["Blush", "#e2b5aa"], ["Forest", "#3f5a43"]], fabrics: "Soft cotton, corduroy, denim, tulle for party looks.", pairs: ["Kids: mustard sweater with denim.", "Sweet 16: one statement gown plus a casual outfit with friends.", "Siblings in coordinating, not matching, colors."], avoid: "Characters and logos, uncomfortable shoes.", mood: "Playful, bright, comfy" },
  { type: "plus", palette: [["Emerald", "#2f6b52"], ["Cobalt", "#2e4f9a"], ["Wine", "#6b2737"], ["Camel", "#b88b5a"], ["Black", "#1c1c1e"]], fabrics: "Structured knits, wrap dresses, tailored jackets, flowing maxi skirts.", pairs: ["Wrap dress in emerald with a defined waist.", "Tailored camel jacket over black.", "Cobalt maxi dress for movement shots."], avoid: "Shapeless, oversized clothes. Fit is everything.", mood: "Bold, confident, rich" },
  { type: "group", palette: [["Cream", "#efe6d6"], ["Dusty rose", "#c99a96"], ["Slate", "#5f6b78"], ["Tan", "#c4a27a"], ["Denim", "#5d7898"]], fabrics: "Mixed textures: knit, denim, cotton, linen.", pairs: ["Pick 3 colors and give each person one main color.", "Little ones in the brightest color.", "Teams: brand color for everyone, different styles."], avoid: "Everyone in the same white shirt and jeans.", mood: "Connected, relaxed, together" }
];
