import Map "mo:core/Map";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Float "mo:core/Float";

module {
  type Exercise = {
    id : Text;
    name : Text;
    muscleGroup : Text;
    category : Text;
    isCustom : Bool;
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

  type OldActor = {
    exerciseStore : Map.Map<Text, Exercise>;
    templateStore : Map.Map<Text, WorkoutTemplate>;
    sessionStore : Map.Map<Text, WorkoutSession>;
    bodyWeightStore : Map.Map<Text, BodyWeightEntry>;
    bodyMeasurementStore : Map.Map<Text, BodyMeasurement>;
    userStore : Map.Map<Text, User>;
    seeded : Bool;
  };

  type NewActor = {
    exerciseStore : Map.Map<Text, Exercise>;
    templateStore : Map.Map<Text, WorkoutTemplate>;
    sessionStore : Map.Map<Text, WorkoutSession>;
    bodyWeightStore : Map.Map<Text, BodyWeightEntry>;
    bodyMeasurementStore : Map.Map<Text, BodyMeasurement>;
    userStore : Map.Map<Text, User>;
    seeded : Bool;
  };

  public func run(old : OldActor) : NewActor {
    {
      exerciseStore = old.exerciseStore;
      templateStore = old.templateStore;
      sessionStore = old.sessionStore;
      bodyWeightStore = old.bodyWeightStore;
      bodyMeasurementStore = old.bodyMeasurementStore;
      userStore = old.userStore;
      seeded = old.seeded;
    };
  };
};
