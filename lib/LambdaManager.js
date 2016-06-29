var fs = require('fs-extra');
var uuid = require('uuid');
function LambdaManager(serviceName, lambdaFactory, apiConfiguration) {
	this.ServiceName = serviceName;
	this.LambdaFactory = lambdaFactory;
	this.ApiConfiguration = apiConfiguration;
}

LambdaManager.prototype.PublishLambdaPromise = function(accountId, zipArchive) {
	var configuration = this.ApiConfiguration;
	var functionName = `${this.ServiceName}-${configuration.FunctionName}`;

	return this.LambdaFactory.listVersionsByFunction({ FunctionName: functionName, MaxItems: 1 }).promise()
	.then(() => {
		return this.LambdaFactory.updateFunctionConfiguration({
			FunctionName: functionName,
			Handler: configuration.Handler,
			Role: `arn:aws:iam::${accountId}:role/${configuration.Role}`,
			Runtime: configuration.Runtime,
			Description: configuration.Description,
			MemorySize: configuration.MemorySize,
			Timeout: configuration.Timeout,
			VpcConfig: {
				SecurityGroupIds: configuration.SecurityGroupIds,
				SubnetIds: configuration.SubnetIds
			}
		}).promise()
		.then(() => this.LambdaFactory.updateFunctionCode({
			FunctionName: functionName,
			Publish: true,
			ZipFile: fs.readFileSync(zipArchive)
		}).promise());
	}, (failure) => {
		return this.LambdaFactory.createFunction({
			FunctionName: functionName,
			Code: { ZipFile: fs.readFileSync(zipArchive) },
			Handler: configuration.Handler,
			Role: `arn:aws:iam::${accountId}:role/${configuration.Role}`,
			Runtime: configuration.Runtime,
			Description: configuration.Description,
			MemorySize: configuration.MemorySize,
			Publish: configuration.Publish,
			Timeout: configuration.Timeout,
			VpcConfig: {
				SecurityGroupIds: configuration.SecurityGroupIds,
				SubnetIds: configuration.SubnetIds
			}
		}).promise()
	})
	.catch((error) => {
		return Promise.reject({Error: error, Detail: error.stack});
	});
};

LambdaManager.prototype.SetPermissionsPromise = function(accountId, lambdaArn, apiGatewayId) {
	return this.LambdaFactory.addPermission({
		Action: 'lambda:InvokeFunction',
		FunctionName: lambdaArn,
		Principal: 'apigateway.amazonaws.com',
		StatementId: uuid.v4().replace('-', ''),
		SourceArn: `arn:aws:execute-api:us-east-1:${accountId}:${apiGatewayId}/*`
	}).promise().then(data => JSON.parse(data.Statement));
}
module.exports = LambdaManager;