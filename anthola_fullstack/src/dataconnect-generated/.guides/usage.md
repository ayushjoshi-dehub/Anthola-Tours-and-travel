# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, getProfile, createCategory, createContentItem } from '@dataconnect/generated';


// Operation CreateUser:  For variables, look at type CreateUserVars in ../index.d.ts
const { data } = await CreateUser(dataConnect, createUserVars);

// Operation GetProfile:  For variables, look at type GetProfileVars in ../index.d.ts
const { data } = await GetProfile(dataConnect, getProfileVars);

// Operation CreateCategory:  For variables, look at type CreateCategoryVars in ../index.d.ts
const { data } = await CreateCategory(dataConnect, createCategoryVars);

// Operation CreateContentItem:  For variables, look at type CreateContentItemVars in ../index.d.ts
const { data } = await CreateContentItem(dataConnect, createContentItemVars);


```