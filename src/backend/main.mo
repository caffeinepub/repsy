import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Bool "mo:core/Bool";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Order "mo:core/Order";

actor {
  type Exercise = {
    id : Text;
    name : Text;
    muscleGroup : Text;
    category : Text;
    isCustom : Bool;
  };

  module Exercise {
    public func compare(ex1 : Exercise, ex2 : Exercise) : Order.Order {
      Text.compare(ex1.name, ex2.name);
    };
  };

  type TemplateExercise = {
    exerciseId : Text;
    sets : Nat;
    order : Nat;
  };

  type WorkoutTemplate = {
    id : Text;
    userId : Text;
    name : Text;
    createdAt : Int;
    exercises : [TemplateExercise];
  };

  module WorkoutTemplate {
    public func compareByCreatedAt(t1 : WorkoutTemplate, t2 : WorkoutTemplate) : Order.Order {
      if (t1.createdAt < t2.createdAt) { #less } else if (t1.createdAt > t2.createdAt) {
        #greater;
      } else { #equal };
    };
  };

  type WorkoutSet = {
    id : Text;
    setNumber : Nat;
    weight : ?Float;
    reps : ?Nat;
    completed : Bool;
    isPR : Bool;
  };

  type SessionExercise = {
    id : Text;
    exerciseId : Text;
    order : Nat;
    sets : [WorkoutSet];
  };

  type WorkoutSession = {
    id : Text;
    userId : Text;
    templateId : ?Text;
    name : Text;
    startedAt : Int;
    finishedAt : ?Int;
    durationSeconds : ?Nat;
    totalVolume : Float;
    prCount : Nat;
    notes : ?Text;
    exercises : [SessionExercise];
  };

  module WorkoutSession {
    public func compareByStartedAt(s1 : WorkoutSession, s2 : WorkoutSession) : Order.Order {
      Int.compare(s2.startedAt, s1.startedAt);
    };
  };

  type BodyWeightEntry = {
    id : Text;
    userId : Text;
    weight : Float;
    unit : Text;
    loggedAt : Int;
  };

  type BodyMeasurement = {
    id : Text;
    userId : Text;
    bodyPart : Text;
    value : Float;
    unit : Text;
    loggedAt : Int;
  };

  type User = {
    id : Text;
    name : Text;
    username : Text;
    email : Text;
  };

  type WorkoutSetInput = {
    setNumber : Nat;
    weight : ?Float;
    reps : ?Nat;
    completed : Bool;
    isPR : Bool;
  };

  type SessionExerciseInput = {
    exerciseId : Text;
    order : Nat;
    sets : [WorkoutSetInput];
  };

  let exerciseStore = Map.empty<Text, Exercise>();
  let templateStore = Map.empty<Text, WorkoutTemplate>();
  let sessionStore = Map.empty<Text, WorkoutSession>();
  let bodyWeightStore = Map.empty<Text, BodyWeightEntry>();
  let bodyMeasurementStore = Map.empty<Text, BodyMeasurement>();
  let userStore = Map.empty<Text, User>();

  var seeded = false;

  func generateId(prefix : Text) : Text {
    prefix # "-" # Time.now().toText();
  };

  // Seed Data
  public shared ({ caller }) func seed() : async () {
    if (seeded) { return };
    seeded := true;

    // Seed user
    let user : User = {
      id = "demo-user-1";
      name = "Alex";
      username = "alex";
      email = "alex@repsy.app";
    };
    userStore.add("demo-user-1", user);

    // Seed exercises
    let exercises = [
      // Chest
      { id = "bench-press"; name = "Bench Press"; muscleGroup = "Chest"; category = "Barbell"; isCustom = false },
      { id = "incline-bench-press"; name = "Incline Bench Press"; muscleGroup = "Chest"; category = "Barbell"; isCustom = false },
      { id = "decline-bench-press"; name = "Decline Bench Press"; muscleGroup = "Chest"; category = "Barbell"; isCustom = false },
      { id = "dumbbell-fly"; name = "Dumbbell Fly"; muscleGroup = "Chest"; category = "Dumbbell"; isCustom = false },
      { id = "cable-fly"; name = "Cable Fly"; muscleGroup = "Chest"; category = "Cable"; isCustom = false },
      { id = "push-up"; name = "Push-Up"; muscleGroup = "Chest"; category = "Bodyweight"; isCustom = false },
      { id = "chest-dip"; name = "Chest Dip"; muscleGroup = "Chest"; category = "Bodyweight"; isCustom = false },
      { id = "pec-deck"; name = "Pec Deck"; muscleGroup = "Chest"; category = "Machine"; isCustom = false },
      { id = "incline-dumbbell-press"; name = "Incline Dumbbell Press"; muscleGroup = "Chest"; category = "Dumbbell"; isCustom = false },
      { id = "dumbbell-bench-press"; name = "Dumbbell Bench Press"; muscleGroup = "Chest"; category = "Dumbbell"; isCustom = false },

      // Shoulders
      { id = "overhead-press"; name = "Overhead Press"; muscleGroup = "Shoulders"; category = "Barbell"; isCustom = false },
      { id = "dumbbell-shoulder-press"; name = "Dumbbell Shoulder Press"; muscleGroup = "Shoulders"; category = "Dumbbell"; isCustom = false },
      { id = "arnold-press"; name = "Arnold Press"; muscleGroup = "Shoulders"; category = "Dumbbell"; isCustom = false },
      { id = "lateral-raise"; name = "Lateral Raise"; muscleGroup = "Shoulders"; category = "Dumbbell"; isCustom = false },
      { id = "front-raise"; name = "Front Raise"; muscleGroup = "Shoulders"; category = "Dumbbell"; isCustom = false },
      { id = "face-pull"; name = "Face Pull"; muscleGroup = "Shoulders"; category = "Cable"; isCustom = false },
      { id = "upright-row"; name = "Upright Row"; muscleGroup = "Shoulders"; category = "Barbell"; isCustom = false },
      { id = "rear-delt-fly"; name = "Rear Delt Fly"; muscleGroup = "Shoulders"; category = "Dumbbell"; isCustom = false },
      { id = "cable-lateral-raise"; name = "Cable Lateral Raise"; muscleGroup = "Shoulders"; category = "Cable"; isCustom = false },
      { id = "machine-shoulder-press"; name = "Machine Shoulder Press"; muscleGroup = "Shoulders"; category = "Machine"; isCustom = false },

      // Triceps
      { id = "tricep-pushdown"; name = "Tricep Pushdown"; muscleGroup = "Triceps"; category = "Cable"; isCustom = false },
      { id = "skull-crusher"; name = "Skull Crusher"; muscleGroup = "Triceps"; category = "Barbell"; isCustom = false },
      { id = "overhead-tricep-extension"; name = "Overhead Tricep Extension"; muscleGroup = "Triceps"; category = "Dumbbell"; isCustom = false },
      { id = "close-grip-bench-press"; name = "Close-Grip Bench Press"; muscleGroup = "Triceps"; category = "Barbell"; isCustom = false },
      { id = "tricep-dip"; name = "Tricep Dip"; muscleGroup = "Triceps"; category = "Bodyweight"; isCustom = false },
      { id = "diamond-push-up"; name = "Diamond Push-Up"; muscleGroup = "Triceps"; category = "Bodyweight"; isCustom = false },
      { id = "cable-overhead-tricep-extension"; name = "Cable Overhead Tricep Extension"; muscleGroup = "Triceps"; category = "Cable"; isCustom = false },
      { id = "tricep-kickback"; name = "Tricep Kickback"; muscleGroup = "Triceps"; category = "Dumbbell"; isCustom = false },

      // Back
      { id = "deadlift"; name = "Deadlift"; muscleGroup = "Back"; category = "Barbell"; isCustom = false },
      { id = "barbell-row"; name = "Barbell Row"; muscleGroup = "Back"; category = "Barbell"; isCustom = false },
      { id = "dumbbell-row"; name = "Dumbbell Row"; muscleGroup = "Back"; category = "Dumbbell"; isCustom = false },
      { id = "lat-pulldown"; name = "Lat Pulldown"; muscleGroup = "Back"; category = "Cable"; isCustom = false },
      { id = "pull-up"; name = "Pull-Up"; muscleGroup = "Back"; category = "Bodyweight"; isCustom = false },
      { id = "chin-up"; name = "Chin-Up"; muscleGroup = "Back"; category = "Bodyweight"; isCustom = false },
      { id = "seated-cable-row"; name = "Seated Cable Row"; muscleGroup = "Back"; category = "Cable"; isCustom = false },
      { id = "t-bar-row"; name = "T-Bar Row"; muscleGroup = "Back"; category = "Barbell"; isCustom = false },
      { id = "rack-pull"; name = "Rack Pull"; muscleGroup = "Back"; category = "Barbell"; isCustom = false },
      { id = "straight-arm-pulldown"; name = "Straight-Arm Pulldown"; muscleGroup = "Back"; category = "Cable"; isCustom = false },
      { id = "chest-supported-row"; name = "Chest-Supported Row"; muscleGroup = "Back"; category = "Machine"; isCustom = false },

      // Biceps
      { id = "barbell-curl"; name = "Barbell Curl"; muscleGroup = "Biceps"; category = "Barbell"; isCustom = false },
      { id = "dumbbell-curl"; name = "Dumbbell Curl"; muscleGroup = "Biceps"; category = "Dumbbell"; isCustom = false },
      { id = "hammer-curl"; name = "Hammer Curl"; muscleGroup = "Dumbbell"; category = "Dumbbell"; isCustom = false },
      { id = "incline-dumbbell-curl"; name = "Incline Dumbbell Curl"; muscleGroup = "Biceps"; category = "Dumbbell"; isCustom = false },
      { id = "cable-curl"; name = "Cable Curl"; muscleGroup = "Biceps"; category = "Cable"; isCustom = false },
      { id = "preacher-curl"; name = "Preacher Curl"; muscleGroup = "Biceps"; category = "Barbell"; isCustom = false },
      { id = "concentration-curl"; name = "Concentration Curl"; muscleGroup = "Biceps"; category = "Dumbbell"; isCustom = false },
      { id = "ez-bar-curl"; name = "EZ-Bar Curl"; muscleGroup = "Barbell"; category = "Barbell"; isCustom = false },
      { id = "spider-curl"; name = "Spider Curl"; muscleGroup = "Dumbbell"; category = "Dumbbell"; isCustom = false },

      // Legs
      { id = "squat"; name = "Squat"; muscleGroup = "Legs"; category = "Barbell"; isCustom = false },
      { id = "front-squat"; name = "Front Squat"; muscleGroup = "Legs"; category = "Barbell"; isCustom = false },
      { id = "leg-press"; name = "Leg Press"; muscleGroup = "Legs"; category = "Machine"; isCustom = false },
      { id = "romanian-deadlift"; name = "Romanian Deadlift"; muscleGroup = "Legs"; category = "Barbell"; isCustom = false },
      { id = "bulgarian-split-squat"; name = "Bulgarian Split Squat"; muscleGroup = "Legs"; category = "Dumbbell"; isCustom = false },
      { id = "leg-extension"; name = "Leg Extension"; muscleGroup = "Legs"; category = "Machine"; isCustom = false },
      { id = "leg-curl"; name = "Leg Curl"; muscleGroup = "Legs"; category = "Machine"; isCustom = false },
      { id = "calf-raise"; name = "Calf Raise"; muscleGroup = "Legs"; category = "Machine"; isCustom = false },
      { id = "hack-squat"; name = "Hack Squat"; muscleGroup = "Legs"; category = "Machine"; isCustom = false },
      { id = "goblet-squat"; name = "Goblet Squat"; muscleGroup = "Legs"; category = "Dumbbell"; isCustom = false },
      { id = "walking-lunge"; name = "Walking Lunge"; muscleGroup = "Legs"; category = "Dumbbell"; isCustom = false },
      { id = "step-up"; name = "Step-Up"; muscleGroup = "Legs"; category = "Dumbbell"; isCustom = false },
      { id = "sumo-deadlift"; name = "Sumo Deadlift"; muscleGroup = "Legs"; category = "Barbell"; isCustom = false },
      { id = "seated-calf-raise"; name = "Seated Calf Raise"; muscleGroup = "Legs"; category = "Machine"; isCustom = false },

      // Glutes
      { id = "hip-thrust"; name = "Hip Thrust"; muscleGroup = "Glutes"; category = "Barbell"; isCustom = false },
      { id = "glute-bridge"; name = "Glute Bridge"; muscleGroup = "Glutes"; category = "Bodyweight"; isCustom = false },
      { id = "cable-kickback"; name = "Cable Kickback"; muscleGroup = "Glutes"; category = "Cable"; isCustom = false },
      { id = "donkey-kick"; name = "Donkey Kick"; muscleGroup = "Glutes"; category = "Bodyweight"; isCustom = false },
      { id = "abductor-machine"; name = "Abductor Machine"; muscleGroup = "Glutes"; category = "Machine"; isCustom = false },

      // Core
      { id = "plank"; name = "Plank"; muscleGroup = "Core"; category = "Bodyweight"; isCustom = false },
      { id = "crunch"; name = "Crunch"; muscleGroup = "Core"; category = "Bodyweight"; isCustom = false },
      { id = "hanging-leg-raise"; name = "Hanging Leg Raise"; muscleGroup = "Core"; category = "Bodyweight"; isCustom = false },
      { id = "ab-wheel-rollout"; name = "Ab Wheel Rollout"; muscleGroup = "Core"; category = "Other"; isCustom = false },
      { id = "russian-twist"; name = "Russian Twist"; muscleGroup = "Core"; category = "Bodyweight"; isCustom = false },
      { id = "cable-crunch"; name = "Cable Crunch"; muscleGroup = "Core"; category = "Cable"; isCustom = false },
      { id = "decline-sit-up"; name = "Decline Sit-Up"; muscleGroup = "Core"; category = "Bodyweight"; isCustom = false },
      { id = "bicycle-crunch"; name = "Bicycle Crunch"; muscleGroup = "Core"; category = "Bodyweight"; isCustom = false },
      { id = "dragon-flag"; name = "Dragon Flag"; muscleGroup = "Core"; category = "Bodyweight"; isCustom = false },

      // Cardio/Full Body
      { id = "kettlebell-swing"; name = "Kettlebell Swing"; muscleGroup = "Cardio"; category = "Kettlebell"; isCustom = false },
      { id = "farmers-walk"; name = "Farmers Walk"; muscleGroup = "Full Body"; category = "Dumbbell"; isCustom = false },
      { id = "thruster"; name = "Thruster"; muscleGroup = "Full Body"; category = "Barbell"; isCustom = false },
      { id = "box-jump"; name = "Box Jump"; muscleGroup = "Legs"; category = "Bodyweight"; isCustom = false },
      { id = "battle-ropes"; name = "Battle Ropes"; muscleGroup = "Cardio"; category = "Other"; isCustom = false },
      { id = "jump-rope"; name = "Jump Rope"; muscleGroup = "Cardio"; category = "Other"; isCustom = false },
      { id = "burpee"; name = "Burpee"; muscleGroup = "Full Body"; category = "Bodyweight"; isCustom = false },
    ];

    for (ex in exercises.values()) {
      exerciseStore.add(ex.id, ex);
    };
  };

  // Query Functions
  public query ({ caller }) func getExerciseList() : async [Exercise] {
    exerciseStore.values().toArray().sort();
  };

  public query ({ caller }) func searchExercises(searchQuery : Text) : async [Exercise] {
    exerciseStore.values().toArray().filter(func(ex) { ex.name.contains(#text searchQuery) });
  };

  public query ({ caller }) func getTemplates(userId : Text) : async [WorkoutTemplate] {
    templateStore.values().toArray().filter(func(t) { t.userId == userId }).sort(WorkoutTemplate.compareByCreatedAt);
  };

  public query ({ caller }) func getTemplate(id : Text) : async WorkoutTemplate {
    switch (templateStore.get(id)) {
      case (null) { Runtime.trap("Template does not exist") };
      case (?t) { t };
    };
  };

  public query ({ caller }) func getWorkoutSessions(userId : Text) : async [WorkoutSession] {
    sessionStore.values().toArray().filter(func(s) { s.userId == userId }).sort(WorkoutSession.compareByStartedAt);
  };

  public query ({ caller }) func getWorkoutSession(id : Text) : async WorkoutSession {
    switch (sessionStore.get(id)) {
      case (null) { Runtime.trap("Workout session does not exist") };
      case (?s) { s };
    };
  };

  public query ({ caller }) func getBodyWeightEntries(userId : Text) : async [BodyWeightEntry] {
    bodyWeightStore.values().toArray().filter(func(entry) { entry.userId == userId });
  };

  public query ({ caller }) func getBodyMeasurements(userId : Text, bodyPart : ?Text) : async [BodyMeasurement] {
    let measurements = bodyMeasurementStore.values().toArray().filter(func(m) { m.userId == userId });
    switch (bodyPart) {
      case (null) { measurements };
      case (?part) {
        measurements.filter(func(m) { m.bodyPart == part });
      };
    };
  };

  public query ({ caller }) func getUser(id : Text) : async User {
    switch (userStore.get(id)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) { user };
    };
  };

  // Update Functions
  public shared ({ caller }) func createTemplate(userId : Text, name : Text, exercises : [TemplateExercise]) : async WorkoutTemplate {
    let id = generateId("template");
    let template : WorkoutTemplate = {
      id;
      userId;
      name;
      createdAt = Time.now();
      exercises;
    };
    templateStore.add(id, template);
    template;
  };

  public shared ({ caller }) func deleteTemplate(id : Text) : async Bool {
    switch (templateStore.get(id)) {
      case (null) { Runtime.trap("Template does not exist") };
      case (?_) { templateStore.remove(id); true };
    };
  };

  public shared ({ caller }) func createWorkoutSession(userId : Text, name : Text, templateId : ?Text) : async WorkoutSession {
    let id = generateId("session");
    let session : WorkoutSession = {
      id;
      userId;
      templateId;
      name;
      startedAt = Time.now();
      finishedAt = null;
      durationSeconds = null;
      totalVolume = 0.0;
      prCount = 0;
      notes = null;
      exercises = [];
    };
    sessionStore.add(id, session);
    session;
  };

  public shared ({ caller }) func updateWorkoutSession(id : Text, name : Text, notes : ?Text, exercisesInput : ?[SessionExerciseInput]) : async WorkoutSession {
    switch (sessionStore.get(id)) {
      case (null) { Runtime.trap("Workout session does not exist") };
      case (?existing) {
        let updatedExercises = switch (exercisesInput) {
          case (null) { existing.exercises };
          case (?inputs) {
            let newExercises = List.empty<SessionExercise>();
            for (input in inputs.values()) {
              let sets = List.empty<WorkoutSet>();
              let setCount = if (input.sets.size() > 0) {
                0;
              } else { 0 };
              for (i in Nat.range(1, setCount + 1)) {
                let setInput = input.sets.find(func(s) { s.setNumber == i });
                let set : WorkoutSet = switch (setInput) {
                  case (null) { { id = generateId("set" # i.toText()); setNumber = i; weight = null; reps = null; completed = false; isPR = false } };
                  case (?s) { { id = generateId("set" # i.toText()); setNumber = i; weight = s.weight; reps = s.reps; completed = s.completed; isPR = s.isPR } };
                };
                sets.add(set);
              };
              let exercise : SessionExercise = {
                id = generateId("exercise");
                exerciseId = input.exerciseId;
                order = input.order;
                sets = sets.toArray();
              };
              newExercises.add(exercise);
            };
            newExercises.toArray();
          };
        };

        let updatedSession : WorkoutSession = {
          existing with
          name;
          notes;
          exercises = updatedExercises;
        };
        sessionStore.add(id, updatedSession);
        updatedSession;
      };
    };
  };

  public shared ({ caller }) func finishWorkoutSession(id : Text, finishedAt : Int) : async WorkoutSession {
    switch (sessionStore.get(id)) {
      case (null) { Runtime.trap("Workout session does not exist") };
      case (?existing) {
        let updatedSession : WorkoutSession = {
          existing with finishedAt = ?finishedAt;
        };
        sessionStore.add(id, updatedSession);
        updatedSession;
      };
    };
  };

  public shared ({ caller }) func deleteWorkoutSession(id : Text) : async Bool {
    switch (sessionStore.get(id)) {
      case (null) { Runtime.trap("Workout session does not exist") };
      case (?_) { sessionStore.remove(id); true };
    };
  };

  public shared ({ caller }) func addBodyWeightEntry(userId : Text, weight : Float, unit : Text, loggedAt : Int) : async BodyWeightEntry {
    let id = generateId("bodyWeightEntry");
    let entry : BodyWeightEntry = {
      id;
      userId;
      weight;
      unit;
      loggedAt;
    };
    bodyWeightStore.add(id, entry);
    entry;
  };

  public shared ({ caller }) func addBodyMeasurement(userId : Text, bodyPart : Text, value : Float, unit : Text, loggedAt : Int) : async BodyMeasurement {
    let id = generateId("bodyMeasurement");
    let measurement : BodyMeasurement = {
      id;
      userId;
      bodyPart;
      value;
      unit;
      loggedAt;
    };
    bodyMeasurementStore.add(id, measurement);
    measurement;
  };

  public shared ({ caller }) func updateUser(id : Text, name : Text, username : Text, email : Text) : async User {
    switch (userStore.get(id)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?_) {
        let user : User = {
          id;
          name;
          username;
          email;
        };
        userStore.add(id, user);
        user;
      };
    };
  };

  public shared ({ caller }) func addExerciseToSession(sessionId : Text, exerciseId : Text) : async WorkoutSession {
    switch (sessionStore.get(sessionId)) {
      case (null) { Runtime.trap("Workout session does not exist") };
      case (?existing) {
        let order = existing.exercises.size() + 1;
        let exercise : SessionExercise = {
          id = generateId("exercise");
          exerciseId;
          order;
          sets = [];
        };
        let updatedSession : WorkoutSession = {
          existing with exercises = existing.exercises.concat([exercise]);
        };
        sessionStore.add(sessionId, updatedSession);
        updatedSession;
      };
    };
  };

  public shared ({ caller }) func createCustomExercise(userId : Text, name : Text, muscleGroup : Text, category : Text) : async Exercise {
    let id = generateId("exercise");
    let exercise : Exercise = {
      id;
      name;
      muscleGroup;
      category;
      isCustom = true;
    };
    exerciseStore.add(id, exercise);
    exercise;
  };

  public query ({ caller }) func getExercisesByMuscleGroup(muscleGroup : Text) : async [Exercise] {
    exerciseStore.values().toArray().filter(func(ex) { ex.muscleGroup == muscleGroup });
  };
};
