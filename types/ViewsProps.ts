import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  LogisticsHome: undefined;
  NewShipment: undefined;
  TrackPackage: undefined;
  ShipmentDetails: { id: string };
  UserProfile: undefined;
};


export type LogisticsHomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'LogisticsHome'>;
  //route: RouteProp<RootStackParamList, 'LogisticsHome'>;
};