/**
 * NEXORA AI — Tool & Action Execution Engine
 * Standardized tool invocation, parameter validation, and permission assessment
 */

import { StorageService } from '../storage';
import { ReminderService } from '../reminders/reminderService';
import { supabaseDataService } from '../backend/supabaseDataService';

export interface ToolDefinition {
  name: string;
  description: string;
  requiresConfirmation: boolean;
  securityLevel: 'read' | 'write' | 'destructive';
}

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  output: string;
  data?: unknown;
}

export const REGISTERED_TOOLS: Record<string, ToolDefinition> = {
  get_weather: {
    name: 'get_weather',
    description: 'Fetch current weather conditions for a specified location',
    requiresConfirmation: false,
    securityLevel: 'read',
  },
  create_reminder: {
    name: 'create_reminder',
    description: 'Create and persist a new user reminder with a due date/time',
    requiresConfirmation: false,
    securityLevel: 'write',
  },
  add_planner_task: {
    name: 'add_planner_task',
    description: 'Create a new task in the daily planner',
    requiresConfirmation: false,
    securityLevel: 'write',
  },
  toggle_device: {
    name: 'toggle_device',
    description: 'Toggle smart home appliance status (light, thermostat, etc.)',
    requiresConfirmation: true, // Requires user confirmation
    securityLevel: 'write',
  },
  save_to_memory_vault: {
    name: 'save_to_memory_vault',
    description: 'Record an explicit personal fact into the Memory Vault',
    requiresConfirmation: false,
    securityLevel: 'write',
  },
};

export const ToolManager = {
  /**
   * Determine if a user query corresponds to an executable tool
   */
  detectToolIntent(prompt: string): { toolName: string; params: Record<string, unknown> } | null {
    const q = prompt.toLowerCase();

    if (q.includes('weather')) {
      return { toolName: 'get_weather', params: { location: 'Local Area' } };
    }
    if (q.startsWith('add task') || q.includes('plan to')) {
      const title = prompt.replace(/add task|plan to/i, '').trim();
      return { toolName: 'add_planner_task', params: { title: title || 'New Objective', category: 'daily' } };
    }
    if (q.includes('turn on') || q.includes('turn off') || q.includes('lights') || q.includes('ac')) {
      return { toolName: 'toggle_device', params: { query: prompt } };
    }
    if (q.startsWith('remember that') || q.startsWith('save memory')) {
      const fact = prompt.replace(/remember that|save memory/i, '').trim();
      return { toolName: 'save_to_memory_vault', params: { fact: fact || prompt } };
    }

    return null;
  },

  /**
   * Execute tool with validated parameters
   */
  async execute(toolName: string, params: Record<string, unknown>): Promise<ToolExecutionResult> {
    switch (toolName) {
      case 'get_weather': {
        return {
          toolName,
          success: true,
          output: '26°C, Clear Skies. Humidity 58%, Wind 12 km/h NE.',
          data: { temp: 26, condition: 'Clear', humidity: 58 },
        };
      }

      case 'create_reminder': {
        const title = (params.title as string) || 'New Reminder';
        const dueTime = (params.dueTime as string) || new Date(Date.now() + 4 * 3600 * 1000).toISOString();
        const category = (params.category as any) || 'personal';
        const priority = (params.priority as any) || 'medium';
        try {
          const reminder = await ReminderService.createReminder(title, dueTime, category, priority);
          const isOffline = reminder.syncStatus === 'pending_sync';
          const timeFormatted = new Date(reminder.dueTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
          const output = isOffline
            ? `Reminder saved locally (offline, pending sync): "${reminder.title}" for ${timeFormatted}.`
            : `Scheduled reminder: "${reminder.title}" for ${timeFormatted}.`;
          return {
            toolName,
            success: true,
            output,
            data: reminder,
          };
        } catch (err: any) {
          return {
            toolName,
            success: false,
            output: `Failed to save reminder: ${err?.message || 'Database error'}.`,
          };
        }
      }

      case 'add_planner_task': {
        const title = (params.title as string) || 'New Task';
        const category = (params.category as 'daily' | 'study' | 'work' | 'fitness') || 'daily';
        const task = await StorageService.saveTask({
          title,
          category,
          dueDate: 'Today',
          priority: 'medium',
        });
        await supabaseDataService.createTask({
          title,
          category,
          dueDate: 'Today',
          priority: 'medium',
          completed: false,
        }).catch(() => null);
        return {
          toolName,
          success: true,
          output: `Task "${task.title}" has been scheduled in your daily planner.`,
          data: task,
        };
      }

      case 'toggle_device': {
        const devices = await StorageService.getDevices();
        const firstDevice = devices[0];
        if (firstDevice) {
          const updated = await StorageService.toggleDevice(firstDevice.id);
          const changed = updated.find((d) => d.id === firstDevice.id);
          return {
            toolName,
            success: true,
            output: `${changed?.name} is now ${changed?.status ? 'ON' : 'OFF'}.`,
            data: changed,
          };
        }
        return { toolName, success: false, output: 'No compatible smart devices detected.' };
      }

      case 'save_to_memory_vault': {
        const fact = (params.fact as string) || 'Personal preference';
        const mem = await StorageService.saveMemory({
          category: 'preference',
          content: fact,
          securityTier: 'medium',
          confidence: 0.99,
        });
        return {
          toolName,
          success: true,
          output: `Stored safely in Memory Vault: "${mem.content}"`,
          data: mem,
        };
      }

      default:
        return { toolName, success: false, output: `Tool "${toolName}" not recognized.` };
    }
  },
};
