import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { WorkflowState, WorkflowUpdate } from '@rizzium/shared/interfaces';

// Initialize Firebase Admin
initializeApp();

// Initialize Firestore
const db = getFirestore();

export const syncWorkflowState = onRequest({ cors: true }, async (request, response) => {
  try {
    const update: WorkflowUpdate = request.body;

    // Validate required fields
    if (!update.workflowId) {
      response.status(400).json({
        error: 'Missing required field: workflowId',
      });
      return;
    }

    // Get workflow document
    const workflowRef = db.collection('AgentWorkflows').doc(update.workflowId);
    const workflowDoc = await workflowRef.get();

    if (!workflowDoc.exists) {
      response.status(404).json({
        error: 'Workflow not found',
      });
      return;
    }

    const workflow = workflowDoc.data() as WorkflowState;

    // Update workflow state
    const updateData: Partial<WorkflowState> = {
      updatedAt: new Date(),
      ...(update.status && { status: update.status }),
      ...(update.currentStep && { currentStep: update.currentStep }),
      ...(update.context && { context: { ...workflow.context, ...update.context } }),
    };

    await workflowRef.update(updateData);

    // Log activity
    await db.collection('AgentActivities').add({
      agentId: 'coordinator',
      type: 'coordination',
      title: `Workflow ${update.workflowId} updated`,
      description: `Step: ${update.currentStep || workflow.currentStep}, Status: ${update.status || workflow.status}`,
      timestamp: new Date(),
      status: 'completed',
      metadata: {
        workflowId: update.workflowId,
        previousStep: workflow.currentStep,
        newStep: update.currentStep,
        previousStatus: workflow.status,
        newStatus: update.status,
      },
    });

    logger.info('Workflow state updated successfully', {
      workflowId: update.workflowId,
      status: update.status,
      step: update.currentStep,
    });

    response.status(200).json({
      success: true,
      message: 'Workflow state updated successfully',
    });
  } catch (error) {
    logger.error('Error updating workflow state', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
