import React from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";

const AdvancedControls = ({
  settings,
  onSettingsChange,
  isExpanded,
  onToggleExpanded,
}) => {
  return (
    <div className="bg-card border rounded-lg">
      <button
        className="w-full flex justify-between items-center p-4"
        onClick={onToggleExpanded}
        title="Advanced settings"
      >
        <div className="flex items-center gap-2">
          <Icon name="Settings" />
          <span className="font-semibold">Advanced Controls</span>
        </div>
        <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} />
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 border-t">
          <div className="flex justify-between items-center">
            <span>Continuous Translation</span>
            <Checkbox
              checked={settings.continuousMode}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  continuousMode: e.target.checked,
                })
              }
            />
          </div>

          <div className="flex justify-between items-center">
            <span>Auto Save Results</span>
            <Checkbox
              checked={settings.autoSave}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  autoSave: e.target.checked,
                })
              }
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            title="Reset settings"
            onClick={() =>
              onSettingsChange({
                continuousMode: true,
                autoSave: true,
              })
            }
          >
            <Icon name="RotateCcw" /> Reset
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdvancedControls;
