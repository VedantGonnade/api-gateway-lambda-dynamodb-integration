export interface LambdaFunctionProps {
  functionName: string;
  lambdaPath: string;
  nodeModules?: string[];
  envs: { [key: string]: string };
}