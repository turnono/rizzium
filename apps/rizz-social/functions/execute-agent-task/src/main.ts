/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import OpenAI from 'openai';
import { Agent, TaskDefinition, TaskResult } from '@rizzium/shared/interfaces';
import * as functions from 'firebase-functions';
interface ExecuteTaskRequest {
  agent: Agent;
  task: TaskDefinition;
}

export const executeAgentTask = onCall<ExecuteTaskRequest, Promise<TaskResult>>(async (request) => {
  try {
    const { agent, task } = request.data;
    const openAiKey = functions.config().openai.api_key;

    if (!openAiKey) {
      throw new Error('OpenAI API key not found');
    }

    const client = new OpenAI({ apiKey: openAiKey });

    const completion = await client.chat.completions.create({
      model: agent.model,
      messages: [
        { role: 'system', content: agent.instructions },
        { role: 'user', content: task.description },
      ],
    });

    const result: TaskResult = {
      success: true,
      output: completion.choices[0].message.content || '',
    };

    logger.info('Task executed successfully', { taskId: task.id, agentId: agent.id });
    return result;
  } catch (error) {
    logger.error('Task execution failed', { error });
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
