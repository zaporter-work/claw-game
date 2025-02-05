import { Client, BoardClient, MotionClient, ArmClient, createRobotClient, StreamClient } from '@viamrobotics/sdk';
import type { ResourceName, Constraints, Pose } from '@viamrobotics/sdk';
import * as SDK from '@viamrobotics/sdk';
//import * as env from 'env';

//console.log(env)

// globals
const robotSecret = process.env.VIAM_SECRET
const robotLocation = process.env.VIAM_LOCATION
const grabberPin = '8'
const moveDistance = 20
const ignoreInterrupts = true
const moveHeight = 500

/*
  Create obstacles
*/
const holeObject: SDK.Geometry = {
  center: {
    x: 470, 
    y: 120, 
    z: 0, 
    oX: 0, 
    oY: 0, 
    oZ: 1, 
    theta: 15
  }, 
  box: {
    dimsMm: {
      x: 250, 
      y: 400, 
      z: 300
    }
  }, 
  label: ""
}

const tableObject: SDK.Geometry = {
  center: {
    x: 0,
    y: 0,
    z: 0,
    theta: 105,
    oX: 0,
    oY: 0,
    oZ: 1
  },
  box: {
    dimsMm: {
      x: 2000, 
      y: 2000, 
      z: 30
    }
  },
  label: ''
}

let frontWallObject: SDK.Geometry ={
  center: {
    x: 560,
    y: 0,
    z: 0,
    theta: 15,
    oX: 0,
    oY: 0,
    oZ: 1,
  }, 
  box: {
    dimsMm: {
      x: 15, 
      y: 2000, 
      z: 1000
    }
  },
  label: '',
}

let backWallObject: SDK.Geometry ={
  center: {
    x: 560,
    y: 0,
    z: 0,
    theta: 15,
    oX: 0,
    oY: 0,
    oZ: 1,
  }, 
  box: {
    dimsMm: {
      x: 15, 
      y: 2000, 
      z: 1000
    }
  },
  label: '',
}

let rightWallObject: SDK.Geometry ={
  center: {
    x: 0,
    y: 700,
    z: 0,
    theta: 105,
    oX: 0,
    oY: 0,
    oZ: 1,
  }, 
  box: {
    dimsMm: {
      x: 15, 
      y: 2000, 
      z: 1000
    }
  },
  label: '',
}

let leftWallObject: SDK.Geometry ={
  center: {
    x: 0,
    y: 550,
    z: 0,
    theta: 105,
    oX: 0,
    oY: 0,
    oZ: 1,
  }, 
  box: {
    dimsMm: {
      x: 15, 
      y: 2000, 
      z: 1000
    }
  },
  label: '',
}


async function connect() {
  //This is where you will list your robot secret. You can find this information
  //in your Code Sample tab on your robot page. Check the Typescript code sample 
  //to get started. :)  
  const secret = robotSecret;
  const credential = {
    payload: secret,
    type: 'robot-location-secret',
  };

  //This is the host address of the main part of your robot.
  const host = robotLocation;

  //This is the signaling address of your robot. 
  const signalingAddress = 'https://app.viam.com:443';

  const iceServers = [{ urls: 'stun:global.stun.twilio.com:3478' }];

  return createRobotClient({
    host,
    credential,
    authEntity: host,
    signalingAddress,
    iceServers,
  });
}

function forwardbutton() {
  return <HTMLButtonElement>document.getElementById('forward-button');

}

function backbutton() {
  return <HTMLButtonElement>document.getElementById('back-button');
}

function rightbutton() {
  return <HTMLButtonElement>document.getElementById('right-button');
}

function leftbutton() {
  return <HTMLButtonElement>document.getElementById('left-button');
}

function dropbutton() {
  return <HTMLButtonElement>document.getElementById('drop-button');
}

// function upbutton() {
//   return <HTMLButtonElement>document.getElementById('up-button');
// }


//Creating a delay function for timing 
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}


let constraints: Constraints = {
  orientationConstraintList: [
    {orientationToleranceDegs: 5},
  ],
  linearConstraintList: [],
  collisionSpecificationList: [],
};

async function home(motionClient: MotionClient, armClient: ArmClient) {
  if (ignoreInterrupts && await armClient.isMoving()) { return }

  //Create a Worldstate that has the GeometriesInFrame included 
  let myObstaclesInFrame: SDK.GeometriesInFrame = {
    referenceFrame: "world", 
    geometriesList: [tableObject, holeObject],
  }
  
  let myWorldState: SDK.WorldState ={
    obstaclesList: [myObstaclesInFrame],
    transformsList: [],
  }

  // home position - where ball should be dropped and each game starts
  let home_pose: SDK.Pose = {
    x: 390,
    y: 105,
    z: moveHeight,
    theta: 0,
    oX: 0,
    oY: 0,
    oZ: -1,
  };
  
  let home_pose_in_frame: SDK.PoseInFrame ={
    referenceFrame: "world", 
    pose: home_pose
  }

  try {   
    let myResourceName: ResourceName = {
      namespace: 'rdk', 
      type: 'component', 
      subtype: 'arm', 
      name: 'myArm' 
  }
    
    await motionClient.move(home_pose_in_frame, myResourceName, myWorldState, constraints)
   
  } finally {
    //homebutton().disabled = false;
  }
}

async function forward(motionClient: MotionClient, armClient: ArmClient) {
  if (ignoreInterrupts && await armClient.isMoving()) { return }

  //Create a WorldState that has Geometries in Frame included 
  let myObstaclesInFrame: SDK.GeometriesInFrame = {
    referenceFrame: "world", 
    geometriesList: [frontWallObject],
  }
  
  let myWorldState: SDK.WorldState ={
    obstaclesList: [myObstaclesInFrame],
    transformsList: [],
  }

  let myResourceName: ResourceName = {
      namespace: 'rdk', 
      type: 'component', 
      subtype: 'arm', 
      name: 'myArm' 
  }

  //Get current position of the arm 
  console.log('im trying to print the current position')
  let currentPosition = await motionClient.getPose(myResourceName, 'world', [])
  console.log('current position:' + JSON.stringify(currentPosition))
  let forwardPose: Pose = {
    x: currentPosition.pose!.x + moveDistance,
    y: currentPosition.pose!.y,
    z: currentPosition.pose!.z,
    theta: 0,
    oX: 0,
    oY: 0, 
    oZ: -1
  };

  let forwardPoseInFrame: SDK.PoseInFrame ={
    referenceFrame: "world", 
    pose: forwardPose
  }

  await motionClient.move(forwardPoseInFrame, myResourceName, myWorldState, constraints)
}

async function back(motionClient: MotionClient, armClient: ArmClient) {
  if (ignoreInterrupts && await armClient.isMoving()) { return }

  //Create a WorldState that has Geometries in Frame included 
  let myObstaclesInFrame: SDK.GeometriesInFrame = {
    referenceFrame: "world", 
    geometriesList: [backWallObject],
  }
  
  let myWorldState: SDK.WorldState ={
    obstaclesList: [myObstaclesInFrame],
    transformsList: [],
  }

  let myResourceName: ResourceName = {
      namespace: 'rdk', 
      type: 'component', 
      subtype: 'arm', 
      name: 'myArm' 
  }

  //Get current position of the arm 
  console.log('im trying to print the current position')
  let currentPosition = await motionClient.getPose(myResourceName, 'world', [])
  console.log('current position:' + JSON.stringify(currentPosition))
  let backPose: Pose = {
    x: currentPosition.pose!.x -moveDistance,
    y: currentPosition.pose!.y,
    z: currentPosition.pose!.z,
    theta: 0,
    oX: 0,
    oY: 0,
    oZ: -1
  };

  let backPoseInFrame: SDK.PoseInFrame ={
    referenceFrame: "world", 
    pose: backPose
  }

  await motionClient.move(backPoseInFrame, myResourceName, myWorldState, constraints)
}

async function right(motionClient: MotionClient, armClient: ArmClient) {
  if (ignoreInterrupts && await armClient.isMoving()) { return }

  //Create a WorldState that has Geometries in Frame included 
  let myObstaclesInFrame: SDK.GeometriesInFrame = {
    referenceFrame: "world", 
    geometriesList: [rightWallObject],
  }
  
  let myWorldState: SDK.WorldState ={
    obstaclesList: [myObstaclesInFrame],
    transformsList: [],
  }

  let myResourceName: ResourceName = {
      namespace: 'rdk', 
      type: 'component', 
      subtype: 'arm', 
      name: 'myArm' 
  }

  //Get current position of the arm 
  console.log('im trying to print the current position')
  let currentPosition = await motionClient.getPose(myResourceName, 'world', [])
  console.log('current position:' + JSON.stringify(currentPosition))
  let rightPose: Pose = {
    x: currentPosition.pose!.x,
    y: currentPosition.pose!.y + moveDistance,
    z: currentPosition.pose!.z,
    theta: 0,
    oX: 0,
    oY: 0,
    oZ: -1
  };

  let rightPoseInFrame: SDK.PoseInFrame ={
    referenceFrame: "world", 
    pose: rightPose
  }

  await motionClient.move(rightPoseInFrame, myResourceName, myWorldState, constraints)
}

async function left(motionClient: MotionClient, armClient: ArmClient) {
  if (ignoreInterrupts && await armClient.isMoving()) { console.log("Too fast!"); return }
  
  //Create a WorldState that has Geometries in Frame included 
  let myObstaclesInFrame: SDK.GeometriesInFrame = {
    referenceFrame: "world", 
    geometriesList: [leftWallObject],
  }
  
  let myWorldState: SDK.WorldState ={
    obstaclesList: [myObstaclesInFrame],
    transformsList: [],
  }

  let myResourceName: ResourceName = {
      namespace: 'rdk', 
      type: 'component', 
      subtype: 'arm', 
      name: 'myArm' 
  }

  //Get current position of the arm 
  console.log('im trying to print the current position')
  let currentPosition = await motionClient.getPose(myResourceName, 'world', [])
  console.log('current position:' + JSON.stringify(currentPosition))
  let leftPose: Pose = {
    x: currentPosition.pose!.x,
    y: currentPosition.pose!.y -moveDistance,
    z: currentPosition.pose!.z,
    theta: 0,
    oX: 0,
    oY: 0,
    oZ: -1
  };

  let leftPoseInFrame: SDK.PoseInFrame ={
    referenceFrame: "world", 
    pose: leftPose
  }

  await motionClient.move(leftPoseInFrame, myResourceName, myWorldState, constraints)
}

async function dropDown(motionClient: MotionClient, armClient: ArmClient) {
  if (ignoreInterrupts && await armClient.isMoving()) { return }

  //Create a WorldState that has Geometries in Frame included 
  let myObstaclesInFrame: SDK.GeometriesInFrame = {
    referenceFrame: "world", 
    geometriesList: [tableObject, holeObject],
  }
  
  let myWorldState: SDK.WorldState ={
    obstaclesList: [myObstaclesInFrame],
    transformsList: [],
  }

  let myResourceName: ResourceName = {
      namespace: 'rdk', 
      type: 'component', 
      subtype: 'arm', 
      name: 'myArm' 
  }

  //Get current position of the arm 
  console.log('im trying to print the current position')
  let currentPosition = await motionClient.getPose(myResourceName, 'world', [])
  console.log('current position:' + JSON.stringify(currentPosition))

  
  let dropPose: Pose = {
    x: currentPosition.pose!.x,
    y: currentPosition.pose!.y,
    z: 240,
    theta: 0,
    oX: 0,
    oY: 0,
    oZ: currentPosition.pose!.oZ
  };

  let dropPoseInFrame: SDK.PoseInFrame ={
    referenceFrame: "world", 
    pose: dropPose
  }

  //Drop the claw down
  console.log('im about to drop')
  await motionClient.move(dropPoseInFrame, myResourceName, myWorldState, constraints)
  console.log('dropped')

}

async function up(motionClient: MotionClient, armClient: ArmClient) {
  if (ignoreInterrupts && await armClient.isMoving()) { return }

  //Create a WorldState that has Geometries in Frame included 

  let myObstaclesInFrame: SDK.GeometriesInFrame = {
    referenceFrame: "world", 
    geometriesList: [],
  }
  
  let myWorldState: SDK.WorldState ={
    obstaclesList: [myObstaclesInFrame],
    transformsList: [],
  }

  let myResourceName: ResourceName = {
      namespace: 'rdk', 
      type: 'component', 
      subtype: 'arm', 
      name: 'myArm' 
  }

  //Get current position of the arm 
  console.log('im trying to print the current position')
  let currentPosition = await motionClient.getPose(myResourceName, 'world', [])
  console.log('current position:' + JSON.stringify(currentPosition))

  
  let upPose: Pose = {
    x: currentPosition.pose!.x,
    y: currentPosition.pose!.y,
    z: moveHeight,
    theta: 0,
    oX: 0,
    oY: 0,
    oZ: currentPosition.pose!.oZ
  };

  let upPoseInFrame: SDK.PoseInFrame ={
    referenceFrame: "world", 
    pose: upPose
  }

  //Pick the claw up 
  console.log('let`s go up')
  await motionClient.move(upPoseInFrame, myResourceName, myWorldState, constraints)
  console.log('up!')

}

async function grab(boardClient: BoardClient) {
  try {
    //grabbutton().disabled = true;

    console.log(await boardClient.getGPIO(grabberPin));
    console.log('i`m grabbin');
    await boardClient.setGPIO(grabberPin, true);
    
   
  } finally {
    //grabbutton().disabled = false;
  }
}

async function release(boardClient: BoardClient) {
  try {
   // grabbutton().disabled = true;

    console.log(await boardClient.getGPIO(grabberPin));
    await boardClient.setGPIO(grabberPin, false);
    await delay(1000);
    console.log('i let go now');
  } finally {
    //grabbutton().disabled = false;
  }
}

async function main() {
  // Connect to client
  let client: Client;  
  try {
    client = await connect();
    console.log('connected!');
  } catch (error) {
    console.log(error);
    return;
  }
  const motionClient = new MotionClient(client, 'planning:builtin');
  const boardClient = new BoardClient(client, 'myBoard');
  const armClient = new ArmClient(client, 'planning:myArm');

  // Add this function at the top of your main.ts file
  function applyErrorClass(element: HTMLElement) {
    element.classList.add("error");
  }

  let useTouch = false;

  // Update the onclick handlers in the main function:

  forwardbutton().onmousedown = async () => {
    if (useTouch) return
    forwardHandler()
  };

  forwardbutton().ontouchstart = async () => {
    useTouch = true
    forwardHandler()
  };

  async function forwardHandler() {
    if (forwardbutton().classList.contains('error')) return;
    try {
      await back(motionClient, armClient);
      if (forwardbutton().classList.contains('custom-box-shadow-active')) {await forwardHandler()};
    } catch (error) {
      console.log(error);
      forwardbutton().classList.add('error');
      forwardbutton()?.querySelector('svg')?.classList.add('icon');
      setTimeout( () => { forwardbutton().classList.remove('error'); }, 3000 )
    }
  }

  backbutton().onmousedown = async () => {
    if (useTouch) return
    backHandler()
  };
  backbutton().ontouchstart = async () => {
    useTouch = true
    backHandler()
  };

  async function backHandler() {
    if (backbutton().classList.contains('error')) return;
    try {
      await forward(motionClient, armClient);
      if (backbutton().classList.contains('custom-box-shadow-active')) {await backHandler()};
    } catch (error) {
      console.log(error);
      backbutton().classList.add('error');
      backbutton()?.querySelector('svg')?.classList.add('icon');
      setTimeout( () => { backbutton().classList.remove('error'); }, 3000 )
    }
  }

  rightbutton().onmousedown = async () => {
    if (useTouch) return
    rightHandler()
  };
  rightbutton().ontouchstart = async () => {
    useTouch = true
    rightHandler()
  };

  async function rightHandler() {
    if (rightbutton().classList.contains('error')) return;
    try {
      await right(motionClient, armClient);
      if (rightbutton().classList.contains('custom-box-shadow-active')) {await rightHandler()};
    } catch (error) {
      console.log(error);
      rightbutton().classList.add('error');
      rightbutton()?.querySelector('svg')?.classList.add('icon');
      setTimeout( () => { rightbutton().classList.remove('error'); }, 3000 )
    }
  }

  leftbutton().onmousedown = async () => {
    if (useTouch) return
    leftHandler()
  };
  leftbutton().ontouchstart = async () => {
    useTouch = true
    leftHandler()
  };

  async function leftHandler() {
    if (leftbutton().classList.contains('error')) return;
    try {
      await left(motionClient, armClient);
      if (leftbutton().classList.contains('custom-box-shadow-active')) {await leftHandler()};
    } catch (error) {
      console.log(error);
      leftbutton().classList.add('error');
      leftbutton()?.querySelector('svg')?.classList.add('icon');
      setTimeout( () => { leftbutton().classList.remove('error'); }, 3000 )
    }
  }

  dropbutton().onmousedown = async () => {
    if (dropbutton().classList.contains('error')) return;
    try {
      await dropDown(motionClient, armClient);
      await grab(boardClient);
      await delay(1000);
      await up(motionClient, armClient);
      await home(motionClient, armClient);
      await delay(1000);
      await release(boardClient);
    } catch (error) {
      console.log(error);
      dropbutton().classList.add('error');
      setTimeout( () => { dropbutton().classList.remove('error'); }, 3000 )
    }
  }

  forwardbutton().disabled = false;
  backbutton().disabled = false;
  rightbutton().disabled = false;
  leftbutton().disabled = false;
  dropbutton().disabled = false;
}

main();
