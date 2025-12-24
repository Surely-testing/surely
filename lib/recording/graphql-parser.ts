
// ============================================
// lib/recording/graphql-parser.ts
// Parses and structures GraphQL queries/responses
// ============================================

import { logger } from '@/lib/utils/logger';

export interface GraphQLOperation {
  operationType: 'query' | 'mutation' | 'subscription';
  operationName?: string;
  variables?: Record<string, any>;
  query: string;
  response?: any;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface ParsedGraphQLRequest {
  timestamp: number;
  url: string;
  operations: GraphQLOperation[];
  duration?: number;
  status?: number;
}

export class GraphQLParser {
  static parseRequest(requestBody: any): GraphQLOperation[] | null {
    try {
      let parsed = requestBody;

      // Parse if string
      if (typeof requestBody === 'string') {
        parsed = JSON.parse(requestBody);
      }

      // Handle batch requests (array)
      if (Array.isArray(parsed)) {
        return parsed.map(op => this.parseOperation(op)).filter(Boolean) as GraphQLOperation[];
      }

      // Handle single request
      const operation = this.parseOperation(parsed);
      return operation ? [operation] : null;
    } catch (error) {
      logger.log('Error parsing GraphQL request:', error);
      return null;
    }
  }

  static parseOperation(operation: any): GraphQLOperation | null {
    if (!operation || typeof operation !== 'object') {
      return null;
    }

    const { query, variables, operationName } = operation;

    if (!query || typeof query !== 'string') {
      return null;
    }

    // Detect operation type
    let operationType: GraphQLOperation['operationType'] = 'query';
    
    if (query.trim().startsWith('mutation')) {
      operationType = 'mutation';
    } else if (query.trim().startsWith('subscription')) {
      operationType = 'subscription';
    }

    return {
      operationType,
      operationName: operationName || this.extractOperationName(query),
      variables: variables || undefined,
      query: query.trim(),
    };
  }

  static parseResponse(responseBody: any): {
    data?: any;
    errors?: GraphQLOperation['errors'];
  } | null {
    try {
      let parsed = responseBody;

      if (typeof responseBody === 'string') {
        parsed = JSON.parse(responseBody);
      }

      return {
        data: parsed.data,
        errors: parsed.errors,
      };
    } catch (error) {
      logger.log('Error parsing GraphQL response:', error);
      return null;
    }
  }

  static extractOperationName(query: string): string | undefined {
    // Extract operation name from query
    // Example: "query GetUser { ... }" -> "GetUser"
    const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
    return match ? match[1] : undefined;
  }

  static formatQuery(query: string): string {
    // Basic GraphQL query formatting
    try {
      return query
        .replace(/\s+/g, ' ')
        .replace(/\{\s+/g, '{ ')
        .replace(/\s+\}/g, ' }')
        .trim();
    } catch {
      return query;
    }
  }

  static extractFields(query: string): string[] {
    // Extract field names from query
    const fields: string[] = [];
    const fieldRegex = /(\w+)(?:\s*\{|\s*\(|\s*$)/g;
    let match;

    while ((match = fieldRegex.exec(query)) !== null) {
      if (match[1] && !['query', 'mutation', 'subscription'].includes(match[1])) {
        fields.push(match[1]);
      }
    }

    return fields;
  }

  static isGraphQLRequest(url: string, body: any, headers?: Record<string, string>): boolean {
    // Check URL
    if (url.toLowerCase().includes('graphql')) {
      return true;
    }

    // Check content-type header
    if (headers?.['content-type']?.includes('application/graphql')) {
      return true;
    }

    // Check body structure
    if (body && typeof body === 'object') {
      if (body.query || body.operationName) {
        return true;
      }
    }

    // Check if body string contains GraphQL keywords
    if (typeof body === 'string') {
      const lowerBody = body.toLowerCase();
      if (
        (lowerBody.includes('query') || lowerBody.includes('mutation')) &&
        lowerBody.includes('{')
      ) {
        return true;
      }
    }

    return false;
  }
}
