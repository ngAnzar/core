

#example:
```pug

.nz-tabs
   nz-tab(label="First tab title")
      ng-template(#content)
         h1 First content

   nz-tab(label="Second tab title")
      ng-template(#content)
         h1 second content

   nz-tab
      ng-template(#label)
         .nz-checkbox Label With Checkbox

      ng-template(#content)
         h1 Third content

```
