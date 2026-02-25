import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

actor {
  // Data Types
  type Exercise = {
    id : Text;
    name : Text;
    muscleGroup : Text;
    category : Text;
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

  // State
  let exerciseStore = Map.empty<Text, Exercise>();
  let templateStore = Map.empty<Text, WorkoutTemplate>();
  let sessionStore = Map.empty<Text, WorkoutSession>();
  let bodyWeightStore = Map.empty<Text, BodyWeightEntry>();
  let bodyMeasurementStore = Map.empty<Text, BodyMeasurement>();
  let userStore = Map.empty<Text, User>();

  var seeded = false;

  // Helper Functions
  func generateId(prefix : Text) : Text {
    prefix # "-" # Time.now().toText();
  };

  // Seed Data
  public shared ({ caller }) func seed() : async () {
    if (seeded) { return () };

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
      { id = "bench-press"; name = "Bench Press"; muscleGroup = "Chest"; category = "Barbell" },
      { id = "squat"; name = "Squat"; muscleGroup = "Legs"; category = "Barbell" },
    ];
    for (ex in exercises.values()) {
      exerciseStore.add(ex.id, ex);
    };

    seeded := true;
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
};
