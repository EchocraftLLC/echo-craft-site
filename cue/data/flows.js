// Session Mode: done-for-you flows. Each stage lists pose names from the pose library, in shooting order.
const FLOWS = [
  { id: "engagement", type: "couple", name: "Engagement & couples", length: "30 to 45 min", stages: [
    ["Warm up", ["Hand-in-hand stroll", "Walk and pull"]],
    ["The basics", ["Back hug", "Hug and look at me", "Forehead touch", "Cheek kiss", "Sitting close"]],
    ["Finish", ["Almost kiss", "The spin"]]
  ]},
  { id: "bride", type: "wedding", name: "Bride: getting ready & portraits", length: "45 min", stages: [
    ["Getting ready", ["Getting ready: earrings", "Zipping the dress"]],
    ["The basics", ["Window light", "Bouquet at the hips", "Over the shoulder", "Back detail", "Veil over the face"]],
    ["Finish", ["Twirl", "Walking away"]]
  ]},
  { id: "wedding-couple", type: "wedding", name: "Wedding: couple & party", length: "45 min", stages: [
    ["Group shots", ["Family formal", "V formation"]],
    ["The basics", ["Just married walk", "Cheek to cheek", "Back hug with bouquet", "Forehead kiss", "Almost kiss"]],
    ["Finish", ["The dip", "Confetti toss"]]
  ]},
  { id: "maternity-solo", type: "maternity", name: "Maternity: just mom", length: "30 to 45 min", stages: [
    ["Warm up", ["Slow walk", "Framing the bump"]],
    ["The basics", ["True profile", "Belly cradle, eyes down", "Over-the-shoulder glow", "Hand on heart, hand on bump", "Face to the sky"]],
    ["Finish", ["Gown flow", "Floor sit"]]
  ]},
  { id: "maternity-family", type: "maternity", name: "Maternity: with partner & family", length: "45 min", stages: [
    ["Warm up", ["Walking hand in hand", "True profile"]],
    ["The basics", ["Partner behind", "Hands together on bump", "Forehead touch over the bump", "Kiss over the bump", "Partner kneels"]],
    ["Finish", ["Family hug around the bump", "Seated together"]]
  ]},
  { id: "corp-men", type: "corporate", name: "Corporate: men", length: "20 to 30 min", stages: [
    ["Headshots", ["Classic headshot", "Squinch", "Soft smile, then big smile"]],
    ["The basics", ["Hands clasped in front", "Relaxed arms crossed", "Hand in pocket", "Leaning forward at the table"]],
    ["Finish", ["Walking through"]]
  ]},
  { id: "corp-women", type: "corporate", name: "Corporate: women", length: "20 to 30 min", stages: [
    ["Headshots", ["Classic headshot", "Squinch", "Soft smile, then big smile"]],
    ["The basics", ["Confident stand", "Arms crossed at the waist", "Wall lean", "Leaning on the table"]],
    ["Finish", ["Walking through"]]
  ]},
  { id: "kids", type: "kids", name: "Kids (ages 2 to 10)", length: "30 min", stages: [
    ["Break the ice", ["Tell me a joke", "Silly faces contest"]],
    ["The basics", ["Run to me", "Big jump", "Peekaboo", "Favorite toy", "Lying in the grass"]],
    ["Finish", ["Bubble chase"]]
  ]},
  { id: "sweet16", type: "kids", name: "Sweet 16", length: "45 min", stages: [
    ["Warm up", ["Laugh with mom", "Wall lean cool"]],
    ["The basics", ["Glam close-up", "Over-the-shoulder glam", "The twirl", "Staircase sit", "Walk away and look back"]],
    ["Finish", ["Friends huddle", "Cake moment"]]
  ]},
  { id: "plus", type: "plus", name: "Plus-size portraits", length: "30 to 45 min", stages: [
    ["Warm up", ["Flowy walk", "The 45-degree angle"]],
    ["The basics", ["Hand on waist, elbow back", "Forehead forward", "Look up at me", "Sit tall at an angle", "Over-the-shoulder"]],
    ["Finish", ["Own it"]]
  ]},
  { id: "family", type: "group", name: "Family session", length: "30 to 45 min", stages: [
    ["Must-haves", ["Classic formal", "The cluster"]],
    ["The basics", ["Walking together", "Swing between", "Parent and child", "Siblings hug", "Bench family"]],
    ["Finish", ["The huddle hug"]]
  ]},
  { id: "friends-teams", type: "group", name: "Friends & teams", length: "30 min", stages: [
    ["Must-haves", ["Staggered team", "Seated front, standing back"]],
    ["The basics", ["Arm in arm", "Walk in a row", "Laughing together", "Back to back"]],
    ["Finish", ["Group hug"]]
  ]}
];
