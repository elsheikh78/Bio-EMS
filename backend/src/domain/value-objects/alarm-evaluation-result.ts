import { AlarmColor } from "../enums/alarm-color";
import { AlarmSeverity } from "../enums/alarm-severity";
import { AlarmStatus } from "../enums/alarm-status";
import { AlarmMessageKey } from "../constants/alarm-message-keys";

export interface AlarmEvaluationResult {
    status: AlarmStatus;
    severity: AlarmSeverity;
    color: AlarmColor;
    isAlarm: boolean;
    messageKey: AlarmMessageKey;
}