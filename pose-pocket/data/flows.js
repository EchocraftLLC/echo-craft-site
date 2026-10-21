// Session Mode: done-for-you flows. Each stage lists pose names from the pose library, in shooting order.
const FLOWS = [
  { id: "engagement", type: "couple", name: "Engagement & couples", length: "60 to 75 min", stages: [
    ["Warm up", ["Hand-in-hand stroll", "Walk and pull", "Coffee date", "Look at the view", "Side hug walk"]],
    ["Classics", ["Back hug", "Hug and look at me", "Cheek kiss", "Forehead kiss", "Head on shoulder", "Hold hands across"]],
    ["Close & connected", ["Forehead touch", "Nose to cheek", "Hands on the face", "Chest lean", "Almost kiss", "Lift the chin"]],
    ["Play", ["Whisper", "Tickle attack", "Eskimo kiss", "Back to back", "The spin", "Piggyback"]],
    ["Sit down", ["Steps sit", "Sitting close", "Picnic lean", "Lying heads together"]],
    ["Finale", ["Running together", "The big squeeze"]]
  ]},
  { id: "bride", type: "wedding", name: "Bride: getting ready & portraits", length: "90 min", stages: [
    ["Getting ready", ["Getting ready: earrings", "Mirror moment", "Necklace clasp", "Zipping the dress", "Shoes on", "Reading the letter"]],
    ["First portraits", ["Window light", "Window seat", "Eyes closed, deep breath", "Bouquet at the hips", "Looking down at bouquet"]],
    ["Show the dress", ["Over the shoulder", "Back detail", "Train spread", "Bouquet held behind", "Bouquet to the side", "Hand on the doorframe"]],
    ["Veil", ["Veil over the face", "Veil in the wind", "Veil from behind"]],
    ["Movement", ["Dress swish", "Twirl", "Walking away", "The aisle walk practice", "Lift the skirt and run"]],
    ["Seated & finale", ["Seated in the gown", "Staircase drape", "Floor sit in the gown", "Ring close-up", "Laugh with your bridesmaids"]]
  ]},
  { id: "wedding-couple", type: "wedding", name: "Wedding: couple & party", length: "60 min", stages: [
    ["Before the ceremony", ["First look", "Prayer or touch before the ceremony"]],
    ["Wedding party", ["Family formal", "V formation", "Party walk", "Bouquet bunch", "Groomsmen jacket throw", "Lean in and laugh", "Toast to the couple"]],
    ["Couple classics", ["Just married walk", "Cheek to cheek", "Back hug with bouquet", "Ring hand on chest", "Ring exchange recreation", "Forehead kiss"]],
    ["Romance", ["Under the veil", "Almost kiss", "Whisper vows", "First dance hold", "The dip", "Spin your partner", "Lift and spin"]],
    ["Big views", ["Grand view", "Veil toss walk", "Bench together", "Sunset silhouette"]],
    ["Celebrate", ["Champagne toast", "Confetti toss", "Hands up and cheer", "Sparkler exit"]]
  ]},
  { id: "maternity-solo", type: "maternity", name: "Maternity: just mom", length: "45 to 60 min", stages: [
    ["Warm up", ["Slow walk", "Field walk", "Belly cradle, eyes down", "Framing the bump"]],
    ["Show the bump", ["True profile", "Profile with a gentle lean", "Over-the-shoulder glow", "Back to the camera", "Window silhouette", "Arms up, hair up"]],
    ["Close & emotional", ["Hand on heart, hand on bump", "Heart hands", "Close-up with hands", "Face to the sky"]],
    ["Story details", ["Hold the baby shoes", "Ultrasound on the belly", "Belly letters", "Flower crown moment"]],
    ["Gown & movement", ["Gown flow", "Gown held up", "Twirl in the gown", "Fabric wrap"]],
    ["Rest & finish", ["Chair lean", "Floor sit", "Kneeling", "Lying on your side"]]
  ]},
  { id: "maternity-family", type: "maternity", name: "Maternity: with partner & family", length: "60 min", stages: [
    ["Warm up", ["Walking hand in hand", "Slow walk", "Framing the bump"]],
    ["Mom solo", ["True profile", "Belly cradle, eyes down", "Over-the-shoulder glow", "Face to the sky", "Gown flow"]],
    ["Partner", ["Partner behind", "Hands together on bump", "Forehead touch over the bump", "Kiss over the bump", "Partner kneels", "Partner whispers to baby", "Scan photo", "Lift the shirt together"]],
    ["Family", ["Big sibling", "Big sibling shirt", "Family hug around the bump", "Pet in the picture"]],
    ["Seated & finale", ["Seated together", "Floor sit", "Hand on heart, hand on bump", "Twirl in the gown", "Heart hands"]]
  ]},
  { id: "corp-men", type: "corporate", name: "Corporate: men", length: "30 to 45 min", stages: [
    ["Headshots first", ["Classic headshot", "Squinch", "Soft smile, then big smile", "Slight head tilt down", "Over the shoulder", "Laughing headshot"]],
    ["Standing", ["Hands clasped in front", "Jacket button", "Hand in pocket", "Cufflink adjust", "Tie adjust", "Relaxed arms crossed", "Arms crossed, leaning on desk"]],
    ["Seated", ["Leaning forward at the table", "Elbows on knees", "Leaning back, ankle on knee", "Desk perch", "Chin on fist, lightly"]],
    ["At work", ["Laptop moment", "Mid-conversation", "Presenting", "Phone call", "Tools of the trade"]],
    ["On the move", ["Walking through", "Jacket over shoulder", "Coming down the stairs", "City walk"]]
  ]},
  { id: "corp-women", type: "corporate", name: "Corporate: women", length: "30 to 45 min", stages: [
    ["Headshots first", ["Classic headshot", "Squinch", "Soft smile, then big smile", "Over the shoulder", "Light hand near jaw", "Hair behind the ear", "Laughing headshot"]],
    ["Standing", ["Confident stand", "Blazer lapel", "Arms crossed at the waist", "Hand on the chair back", "Necklace touch", "Wall lean", "Window look"]],
    ["Seated", ["Crossed ankles", "Leaning on the table", "Seated, crossed legs", "Couch casual"]],
    ["At work", ["Laptop moment", "Mid-conversation", "Notebook moment", "Coffee in hand", "Tools of the trade"]],
    ["On the move", ["Stride with a bag", "Walking through", "Coming down the stairs"]]
  ]},
  { id: "kids", type: "kids", name: "Kids (ages 2 to 10)", length: "30 to 45 min", stages: [
    ["Break the ice", ["Tell me a joke", "Silly faces contest", "Stinky feet", "Superhero"]],
    ["Burn energy", ["Big jump", "Run to me", "Hop like a bunny", "Tiptoe sneak", "Follow the leader", "Bubble chase"]],
    ["Eyes to the lens", ["Sticker on the nose", "Look at the bird!", "Secret for the camera", "Peekaboo"]],
    ["Calm moments", ["Favorite toy", "Read a book", "Snack break", "Tummy time", "Lying in the grass"]],
    ["Outdoor play", ["Flower sniff", "Blow a dandelion", "Leaf toss", "Hug a tree", "Swing high", "Kiss for the puppy", "Big hat"]],
    ["Finale", ["Puddle jump", "Sit on the big chair"]]
  ]},
  { id: "sweet16", type: "kids", name: "Sweet 16", length: "60 min", stages: [
    ["Warm up", ["Laugh with mom", "Phone in hand", "Mirror selfie", "Wall lean cool"]],
    ["Glam portraits", ["Glam close-up", "Over-the-shoulder glam", "Crown moment", "Runway stance", "Sash and smile", "Back of the dress"]],
    ["The dress", ["The twirl", "Staircase sit", "Floor sit with dress spread", "Throne pose", "Walk away and look back"]],
    ["Movement", ["Runway walk", "Hair flip", "Dress lift run", "Kiss the air"]],
    ["Friends & family", ["Squad walk", "Friends huddle", "Court bow", "Family with the birthday girl"]],
    ["Party", ["Number balloons", "Cake moment", "Confetti throw", "Sparkler moment"]]
  ]},
  { id: "plus", type: "plus", name: "Plus-size portraits", length: "45 to 60 min", stages: [
    ["Warm up", ["Flowy walk", "Laughing close-up", "Wall lean", "The 45-degree angle"]],
    ["Flattering standing", ["Hand on waist, elbow back", "S-curve", "Front foot pointed at me", "Arms with space", "Jacket open", "Purse on the forearm", "Over-the-shoulder"]],
    ["Close-ups", ["Forehead forward", "Look up at me", "Tongue to the roof", "Hand frame", "Side light glow", "Soft smile, lips parted"]],
    ["Seated", ["Sit tall at an angle", "Knees angled away", "Cross your legs, toward me", "Side sit on the floor", "Lounge on the couch", "Lying on your side"]],
    ["Confidence finale", ["Hands in hair", "Hip pop", "Twirl", "Own it"]]
  ]},
  { id: "family", type: "group", name: "Family session", length: "45 to 60 min", stages: [
    ["The must-have shots first", ["Classic formal", "The cluster", "Kids in front, parents leaning in", "Grandparents center", "Bench family"]],
    ["Get moving", ["Walking together", "Swing between", "Run toward me", "Walking away", "Piggyback race"]],
    ["Small groups", ["Parent and child", "Siblings hug", "Dad and daughter dance", "Mom and son tickle", "Parents kiss, kids say ew", "Look at the baby"]],
    ["Play", ["Silly face round", "Airplane", "Spin the kids", "Shoulder ride", "Tickle line", "Leaf pile"]],
    ["Calm down & finale", ["Story time", "Ground pile", "Family lying in a circle", "Hands stacked", "The huddle hug"]]
  ]},
  { id: "friends-teams", type: "group", name: "Friends & teams", length: "30 to 45 min", stages: [
    ["Must-have group shots", ["Staggered team", "Seated front, standing back", "Stairs team", "Logo wall", "Arms crossed team", "V formation"]],
    ["At work", ["Meeting table", "Whiteboard brainstorm", "Coffee break", "Team walk"]],
    ["Loosen up", ["Laughing together", "High five", "Huddle up", "Cheers!", "Whisper chain"]],
    ["Friends", ["Arm in arm", "Walk in a row", "Shoulder lean line", "Back to back", "Steps stagger", "Couch pile", "Sunglasses squad", "Piggyback pairs"]],
    ["Finale", ["Group jump", "Group hug"]]
  ]}
];
