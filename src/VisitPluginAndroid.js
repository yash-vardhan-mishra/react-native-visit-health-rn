import {LogBox, NativeModules, PermissionsAndroid} from 'react-native';



export const requestActivityRecognitionPermission = async (
  webviewRef
) => {
  console.log('inside requestActivityRecognitionPermission()');
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
      {
        title: 'Need Activity Recognition Permission',
        message: 'This needs access to your Fitness Permission',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('ACTIVITY_RECOGNITION granted');

      askForGoogleFitPermission(webviewRef);
    } else {
      console.log('Fitness permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
};

const askForGoogleFitPermission = async (webviewRef) => {
  try {
    NativeModules.VisitFitnessModule.initiateSDK();

    const isPermissionGranted =
      await NativeModules.VisitFitnessModule.askForFitnessPermission();
    if (isPermissionGranted == 'GRANTED') {
      getDailyFitnessData(webviewRef);
    }
    console.log(`Google Fit Permissionl: ${isPermissionGranted}`);
  } catch (e) {
    console.error(e);
  }
};

const getDailyFitnessData = webviewRef => {
  console.log('getDailyFitnessData() called');

  NativeModules.VisitFitnessModule.requestDailyFitnessData(data => {
    console.log(`getDailyFitnessData() data: ` + data);
    webviewRef.current.injectJavaScript(data);
  });
};

export const requestActivityData = (type, frequency, timeStamp, webviewRef) => {
  console.log('requestActivityData() called');

  NativeModules.VisitFitnessModule.requestActivityDataFromGoogleFit(
    type,
    frequency,
    timeStamp,
    data => {
      console.log(`requestActivityData() data: ` + data);
      webviewRef.current.injectJavaScript('window.' + data);
    },
  );
};

export const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Need Location Permission',
        message: 'Need access to location permission',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Location permission granted');
    } else {
      console.log('Fitness permission denied');
    }
  } catch (e) {
    console.error(e);
  }
};

export const updateApiBaseUrl = (
  apiBaseUrl,
  authtoken,
  googleFitLastSync,
  gfHourlyLastSync
) => {
  console.log('updateApiBaseUrl() called.');
  NativeModules.VisitFitnessModule.initiateSDK();

  NativeModules.VisitFitnessModule.updateApiBaseUrl(
    apiBaseUrl,
    authtoken,
    googleFitLastSync,
    gfHourlyLastSync,
  );
};

export const handleMessage = (event, webviewRef) => {
  console.log(
    'event:' +
      event +
      ' webviewRef: ' +
      webviewRef
  );

  if (event.nativeEvent.data != null) {
    try {
      const parsedObject = JSON.parse(event.nativeEvent.data);

      if (parsedObject.method != null) {
        switch (parsedObject.method) {
          case 'CONNECT_TO_GOOGLE_FIT':
            requestActivityRecognitionPermission(webviewRef);
            break;
          case 'UPDATE_PLATFORM':
            webviewRef.current?.injectJavaScript(
              'window.setSdkPlatform("ANDROID")',
            );
            break;
          case 'UPDATE_API_BASE_URL':
            {
              let apiBaseUrl = parsedObject.apiBaseUrl;
              let authtoken = parsedObject.authtoken;

              let googleFitLastSync = parsedObject.googleFitLastSync;
              let gfHourlyLastSync = parsedObject.gfHourlyLastSync;

              console.log(
                'apiBaseUrl: ' +
                  apiBaseUrl +
                  ' authtoken: ' +
                  authtoken +
                  ' googleFitLastSync: ' +
                  googleFitLastSync +
                  ' gfHourlyLastSync: ' +
                  gfHourlyLastSync,
              );

              updateApiBaseUrl(
                apiBaseUrl,
                authtoken,
                googleFitLastSync,
                gfHourlyLastSync
              );
            }
            break;
          case 'GET_DATA_TO_GENERATE_GRAPH':
            {
              let type = parsedObject.type;
              let frequency = parsedObject.frequency;
              let timeStamp = parsedObject.timestamp;

              console.log(
                'type: ' +
                  type +
                  ' frequency:' +
                  frequency +
                  ' timeStamp: ' +
                  timeStamp,
              );

              requestActivityData(type, frequency, timeStamp, webviewRef);
            }
            break;
          case 'GET_LOCATION_PERMISSIONS':
            {
              requestLocationPermission();
            }
            break;
          case 'CLOSE_VIEW':
            {
            }
            break;
          case 'OPEN_PDF':
            let hraUrl = parsedObject.url;

            NativeModules.VisitFitnessModule.openHraLink(hraUrl);
            console.log('HRA URL:' + hraUrl);

            break;
          default:
            break;
        }
      }
    } catch (exception) {
      console.log('Exception occured:' + exception.message);
    }
  }
};
