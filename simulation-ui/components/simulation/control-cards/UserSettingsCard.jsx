import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import useGlobalState from "@/hooks/use-global-state";

export default function UserSettingsCard() {
  const {
    userSpeed,
    setUserSpeed,
    userSize,
    setUserSize,
    streetSpawnRate,
    setStreetSpawnRate,
    streetMaxUsers,
    setStreetMaxUsers,
  } = useGlobalState();
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">User Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">Speed: {userSpeed[0]}</Label>
          <Slider
            value={userSpeed}
            onValueChange={setUserSpeed}
            max={10}
            min={0.5}
            step={0.5}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Size: {userSize[0]}</Label>
          <Slider
            value={userSize}
            onValueChange={setUserSize}
            max={15}
            min={5}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Spawn rate (users/sec): {streetSpawnRate[0].toFixed(2)}</Label>
          <Slider
            value={streetSpawnRate}
            onValueChange={setStreetSpawnRate}
            max={5}
            min={0}
            step={0.1}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Max users: {streetMaxUsers[0]}</Label>
          <Slider
            value={streetMaxUsers}
            onValueChange={setStreetMaxUsers}
            max={100}
            min={5}
            step={5}
          />
        </div>
      </CardContent>
    </Card>
  );
}
