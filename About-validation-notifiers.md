# Changing styles of input text fields if they are invalid

If the main text area or any of author or email input values is not valid, isso changes style of that input field by adding `invalid` to list of classes of that field. This class will be removed on any change on the field.

These are two styles used for invalid fields defined in isso.css:

```css
.isso-postbox > .form-wrapper .textarea.invalid {
	background-color: #ffdddd;
}

.isso-postbox > .form-wrapper > .auth-section .input-wrapper > input.invalid {
	background-color: #ffdddd;
}
```

