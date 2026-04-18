import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class RecreateAssetInputDto {
  @Field({ nullable: false })
  @IsString()
  @IsNotEmpty()
  _id: string;
}

@InputType()
export class ReprocessAssetInputDto {
  @Field({ nullable: false })
  @IsString()
  @IsNotEmpty()
  _id: string;
}

@InputType()
export class CreateAssetInputDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description: string;

  @Field()
  @IsUrl()
  @IsNotEmpty()
  source_url: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  @IsOptional()
  with_transcription: boolean;

  @Field({ defaultValue: true })
  @IsBoolean()
  @IsOptional()
  with_transcoding: boolean;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  tags: string[];

  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}

@InputType()
export class CreateAssetFromUploadInputDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
